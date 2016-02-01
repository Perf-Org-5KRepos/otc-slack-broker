/**
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2015, 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 */
"use strict";

var
 log4js = require("log4js"),
 nconf = require("nconf"),
 _ = require('underscore'),
 request = require("request")
;

var logger = log4js.getLogger("otc-slack-broker"),
	logBasePath = "lib.util.toolchain-util"
;

var otc_api_url = nconf.get("services:otc-api");

var serviceNames = {};

exports.getToolchainName = getToolchainName;
exports.getServiceName = getServiceName;

function getToolchainName(toolchainId, authorization, callback) {
	var logPrefix = "[" + logBasePath + ".getToolchainName]";
	
	var options = {};
	options.url = otc_api_url + "/toolchains/" + toolchainId;
	options.headers = {"Authorization" : authorization};
	options.json = true;
	request.get(options, function(error, response, body) {
		if (error) {
			logger.error(logPrefix + "Error while getting " + options.url + ":" + error);
		} else if (response.statusCode == 200) {
			if (body.items.length > 0) {
				return callback(null, body.items[0].name);
			} else {
				logger.error(logPrefix + "No toolchain found at " + options.url + " - no items returned");				
			}
		} else {
			logger.error(logPrefix + "No toolchain found at " + options.url + ":" + response.statusCode);			
		} 
		// No toolchain found !
		callback(null, toolchainId);
	});	
}

function getServiceName(serviceId, authorization, callback) {
	var logPrefix = "[" + logBasePath + ".getServiceDisplayName]";
	
	// Put some naive caching here as the number of service is not that much !
	if (!serviceNames[serviceId]) {
		var options = {};
		options.url = otc_api_url + "/services";
		options.headers = {"Authorization" : authorization};
		options.json = true;
		request.get(options, function(error, response, body) {
			if (error) {
				logger.error(logPrefix + "Error while getting " + options.url + ":" + error);
			} else if (response.statusCode == 200) {
				 var service = _.find(body.resources, function(resource) {return resource.entity.unique_id == serviceId});
				 if (service && service.metadata && service.metadata.displayName) {
					 var serviceName = service.metadata.displayName;
					 logger.debug(logPrefix + "Service name fetched from otc-api for serviceId:" + serviceId);
					 serviceNames[serviceId] = serviceName;
					 return callback(null, serviceName);
				 }
			}
			logger.error(logPrefix + "No service found at " + options.url + " with entity.unique_id == " + serviceId);
			// No service found !
			callback(null, serviceId);
		});				
	} else {
		// Found in the internal cache
		callback(null, serviceNames[serviceId]);
	}
}