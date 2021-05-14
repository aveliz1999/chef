# Code Handling and Execution Framework

CHEF is an API for executing arbitrary code securely. All the code execution is handled by docker containers
so that no malicious code can affect the host that it's running on, but it uses small containers in order to avoid long 
startup times. Additionally it runs with the gVisor runsc runtime in order to provide an additional layer of isolation 
from the host system. 

Adding new languages is as simple as adding a YAML object under /src/languages/config in the format of
```yaml
name: language-name
fileExtension: .test
aliases:
  - language-alias-1
  - language-alias-2
image: dockerimage:dockerimage-version
command:
  - language_executable
  - /app/exec
```
So that it executes the code that will be placed in `/app/exec`. Small images like ones based on alpine
should be prioritized.

## Requirements

* Docker must be installed on the host
* Node.js must be installed on the host
* [gVisor runsc environment](https://gvisor.dev/docs/user_guide/install)

## Install Instructions

* `git clone https://github.com/aveliz1999/chef`
* `cd chef`
* `npm install`

## Usage

Running `npm start` will start the server on port 3000 (which can be changed by setting the environment variable `PORT`).

You can then get an API key by sending a POST request to the `/auth` endpoint.

After that, send a POST request to the endpoint with the following format as the body:
```json
{
  "language": "language-here",
  "code": "print('The code to run goes here')",
  "stdin": "The standard input that will be piped in",
  "mode": "runner-mode"
}
```
The API key must be included as a bearer key with the `Authorization` header.
The stdin and mode fields are optional. When no mode is specified, it will default to docker-immediate.

The response body will have the following format for a successful run:

```json
{
  "stdout": "stdout",
  "stderr": "stderr",
  "combinedOutput": "stdout & stderr",
  "executionTime": 1000
}
```
where executionTime is in milliseconds.

If an error occurred while trying to execute the code, the response will have the following format:
```json
{
  "message": "error message here"
}
```