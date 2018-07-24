package org.baristi.moka;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import org.graalvm.polyglot.*;

public class RequestEvaluator extends Thread {
	
	public void run() {
		Context context = Context.newBuilder("js").allowAllAccess(true).option("js.v8-compat", "true").build();
		try {
			context.eval("js", new String(Files.readAllBytes(new File("/context/src/js/request.js").toPath())));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
}
