const https = require('https');
const { SUCCESS_STATUS_CODE, RESULT_STATUS_CODE, ACCEPT_STATUS_CODE } = require('./constants');

// Dynamically fetch Job Scheduler Credentials from Cloud Foundry Environment
const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES || '{}');
const jobSchedulerService = VCAP_SERVICES.jobscheduler ? VCAP_SERVICES.jobscheduler[0] : null;

const CREDENTIALS = jobSchedulerService ? jobSchedulerService.credentials : {};
const UAA = CREDENTIALS.uaa || {};
const OA_CLIENTID = UAA.clientid;
const OA_SECRET = UAA.clientsecret;
const OA_ENDPOINT = UAA.url;

/**
 * Updates the run execution status directly back inside the BTP Job Scheduler Dashboard log
 */
const doUpdateStatus = function (headers, success, message) {
    return new Promise((resolve, reject) => {
        if (!jobSchedulerService) return resolve("Local execution - no scheduler bound");

        return fetchJwtToken(OA_CLIENTID, OA_SECRET)
            .then((jwtToken) => {
                const jobId = headers['x-sap-job-id'];
                const scheduleId = headers['x-sap-job-schedule-id'];
                const runId = headers['x-sap-job-run-id'];
                const host = headers['x-sap-scheduler-host'];
                const data = JSON.stringify({ success: success, message: typeof message === 'object' ? JSON.stringify(message) : message });
                
                const options = {
                    host: host.replace('https://', ''),
                    path: `/scheduler/jobs/${jobId}/schedules/${scheduleId}/runs/${runId}`,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data),
                        Authorization: 'Bearer ' + jwtToken
                    }
                };

                const req = https.request(options, (res) => {
                    const status = res.statusCode;
                    if (status !== SUCCESS_STATUS_CODE && status !== RESULT_STATUS_CODE && status !== ACCEPT_STATUS_CODE) {
                        return reject(new Error(`Failed to update job scheduler dashboard status. Code: ${status}`));
                    }
                    res.on('data', () => {
                        resolve(message);
                    });
                });

                req.on('error', (error) => reject({ error }));
                req.write(data);
                req.end();
            })
            .catch((error) => {
                console.error("Status Update Failed: ", error);
                reject(error);
            });
    });
};

/**
 * Fetches the OAuth security token required to call BTP Scheduler management REST APIs
 */
const fetchJwtToken = function (clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        const options = {
            host: OA_ENDPOINT.replace('https://', ''),
            path: '/oauth/token?grant_type=client_credentials&response_type=token',
            headers: {
                Authorization: "Basic " + Buffer.from(clientId + ':' + clientSecret).toString("base64")
            }
        };
        https.get(options, res => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                try {
                    const responseAsJson = JSON.parse(response);
                    const jwtToken = responseAsJson.access_token;
                    if (!jwtToken) return reject(new Error('Token empty'));
                    resolve(jwtToken);
                } catch (error) {
                    return reject(error);
                }
            });
        }).on("error", (error) => reject({ error }));
    });
};

module.exports = { doUpdateStatus };
