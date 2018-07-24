package org.baristi.moka;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

/**
 * The Moka server.
 * 
 * @author Daniel Ruthardt
 */
public class Moka {
	
	/**
	 * The minimum number of spare request evaluators.
	 */
	public static int MIN_SPARE_REQUEST_EVALUATORS = 25;
	
	/**
	 * The Moka server singleton instance.
	 */
	public static Moka moka;
	
	/**
	 * The prepared spare request evaluators.
	 */
	private Set<RequestEvaluator> spareRequestEvaluators = Collections.synchronizedSet(new HashSet<RequestEvaluator>());
	
	/**
	 * Default constructor.
	 */
	public Moka() {
		// make sure, enough spare request evaluators are prepared
		prepareSpareRequestEvaluators();
	}
	
	/**
	 * Makes sure, enough spare request evaluators are prepared.
	 * If there aren't, the missing number of request evaluators will be prepared.
	 */
	private void prepareSpareRequestEvaluators() {
		// loop as often as we need to prepare spare request evaluators
		for (int i = spareRequestEvaluators.size(); i < MIN_SPARE_REQUEST_EVALUATORS; i++) {
			// prepare a spare request evaluators
			spareRequestEvaluators.add(new RequestEvaluator());
		}
	}
	
	/**
	 * Returns the Moka server singleton instance.
	 * 
	 * @return
	 * 	The Moka server singleton instance.
	 */
	public static Moka getMoka() {
		// check if the Moka server singleton instance has not been created yet
		if (moka == null) {
			// create the Moka server singleton instance
			moka = new Moka();
		}
		
		// return the Moka server singleton instance
		return moka;
	}
	
	/**
	 * Returns a free (spare) request evaluator.
	 * NodeJS currently doesn't support multi-threading, as such provided code will be run right away in the current thread.
	 * 
	 * @param function
	 * @return
	 */
	public synchronized RequestEvaluator getFreeRequestEvaluator(Function function) {
		if (function != null) {
			function.apply(null);
			return null;
		}
		
		prepareSpareRequestEvaluators();
		
		RequestEvaluator freeRequestEvaluator;

		synchronized (spareRequestEvaluators) {
			freeRequestEvaluator = spareRequestEvaluators.iterator().next();
			spareRequestEvaluators.remove(freeRequestEvaluator);
		}
		
		return freeRequestEvaluator;
	}
	
}