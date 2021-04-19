# Code Handling and Execution Framework

CHEF is an API for executing arbitrary code securely. All the code execution is handled by docker containers
so that no malicious code can affect the host that it's running on, but it uses small containers in order to avoid long 
startup times. Adding new languages is as simple as adding a YAML object under /src/languages/config in the format of

```yaml
name: language-name
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

## Install Instructions

* `git clone https://github.com/aveliz1999/chef`
* `cd chef`
* `npm install`

## Usage

Running `npm start` will start the server on port 3000 (which can be changed by setting the environment variable `PORT`).
After that, send a POST request to the endpoint with the following format as the body:

```json
{
  "language": "language-here",
  "code": "print('The code to run goes here')",
  "stdin": "The standard input that will be piped in",
  "mode": "runner-mode"
}
```

The stdin and mode fields is optional. When no mode is specified, it will default to docker-immediate.