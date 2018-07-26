package org.baristi.moka.utils;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Hashtable;
import java.util.function.Function;

/**
 * A recursive file watcher.
 * Callbacks are notified as quickly as possible, remaining code is executed after notifying the callbacks.
 */
public class FileWatcher {

	/**
	 * The base directory being watched recursively.
	 */
	private Path path;
	
	/**
	 * The callback to notify for create events.
	 */
	private Function<String, ?> onCreate;
	
	/**
	 * The callback to notify for delete events.
	 */
	private Function<String, ?> onDelete;
	
	/**
	 * The callback to notify for modify events.
	 */
	private Function<String, ?> onModify;
	
	/**
	 * The watch service.
	 */
	private WatchService watchService;
	
	/**
	 * All watch keys for the base directory as well as all sub-directories.
	 * The value is the absolute path of the watched directory.
	 */
	private Hashtable<WatchKey, Path> watchKeys = new Hashtable<WatchKey, Path>();
	
	/**
	 * Creates, but doesn't start the file watcher.
	 * 
	 * @param path
	 * 	The base directory being watched.
	 * @param onCreate
	 * 	The callback to notify for create events.
	 * @param onDelete
	 * 	The callback to notify for delete events.
	 * @param onModify
	 * 	The callback to notify for modify events.
	 */
	public FileWatcher(String path, Function<String, ?> onCreate, Function<String, ?> onDelete, Function<String, ?> onModify) {
		// store the absolute path of the base directory
		this.path = FileSystems.getDefault().getPath(path).toAbsolutePath();
		// store the callback functions
		this.onCreate = onCreate;
		this.onDelete = onDelete;
		this.onModify = onModify;
	}
	
	/**
	 * Starts watching.
	 * If watching fails, stop() is called internally in order to clean up.
	 * 
	 * @return
	 * 	True, if watching has started, false otherwise.
	 */
	public boolean start() {
		try {
			// create the watch service
			watchService = FileSystems.getDefault().newWatchService();
			// watch the base directory
			watchKeys.put(path.register(
					watchService,
					StandardWatchEventKinds.ENTRY_CREATE,
					StandardWatchEventKinds.ENTRY_DELETE,
					StandardWatchEventKinds.ENTRY_MODIFY
			), path);
			
			// walk all base directorie's sub-directories
			Files.walkFileTree(path, new SimpleFileVisitor<Path>() {
				@Override
				public FileVisitResult preVisitDirectory(Path directory, BasicFileAttributes attributes) throws IOException {
					// watch the current sub-directory
					watchKeys.put(directory.register(
							watchService, 
							StandardWatchEventKinds.ENTRY_CREATE, 
							StandardWatchEventKinds.ENTRY_DELETE, 
							StandardWatchEventKinds.ENTRY_MODIFY
					), directory.toAbsolutePath());
					
					// continue
					return FileVisitResult.CONTINUE;
				}
			});
			
			// watching has started
			return true;
		} catch (IOException e) {
			// cleanup
			stop();
			
			// watching has not started
			return false;
		}
	}
	
	/**
	 * Stops watching.
	 * Watching can be re-started again calling start().
	 */
	public void stop() {
		// loop all watched directories
		watchKeys.forEach((watchKey, path) -> {
			// stop watching the current directory
			watchKey.cancel();
		});
		
		// nothing watched anymore
		watchKeys.clear();
		
		try {
			// close the watch service, not watching anything anymore anyways
			watchService.close();
		} catch (IOException ignore) {} finally {
			// cleanup
			watchService = null;
		} 
	}
	
	/**
	 * Processes all queued events.
	 * Depending on the platform and operating system, processing doesn't necessarily mean polling, the
	 * events should have ended up in the queue without polling.
	 */
	public void process() {
		// the current watch key
		WatchKey watchKey;
		// while the watch service has watch keys having queued events
		while ((watchKey = watchService.poll()) != null) {
			// loop the current watch key's queued events
			for (WatchEvent<?> event : watchKey.pollEvents()) {
				// get the event's absolute path
				Path path = watchKeys.get(watchKey).resolve((Path) event.context()).toAbsolutePath();
				
				// check if the event is a create event
				if (event.kind().equals(StandardWatchEventKinds.ENTRY_CREATE)) {
					// notify the callback for create events
					onCreate.apply(path.toString());
					
					// check if the path is a directory
					if (path.toFile().isDirectory()) {
						try {
							// start watching the newly created directory
							watchKeys.put(path.register(
									watchService, 
									StandardWatchEventKinds.ENTRY_CREATE, 
									StandardWatchEventKinds.ENTRY_DELETE, 
									StandardWatchEventKinds.ENTRY_MODIFY
							), path);
						} catch (IOException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
				} else if (event.kind().equals(StandardWatchEventKinds.ENTRY_DELETE)) {
					// notify the callback for delete events
					onDelete.apply(path.toString());
					
					// check if the path is a directory
					if (path.toFile().isDirectory()) {
						// stop watching the directory
						watchKey.cancel();
						// watching the directory stopped
						watchKeys.remove(watchKey);
					}
				} else if (event.kind().equals(StandardWatchEventKinds.ENTRY_MODIFY)) {
					// notify the callback for modify events
					onModify.apply(path.toString());
				}
			};
			
			// check if resetting the watch key to ready state fails
			if (!watchKey.reset()) {
				// stop watching the directory
				watchKey.cancel();
				// watching the directory stopped
				watchKeys.remove(watchKey);
			}
		}
	}

}
