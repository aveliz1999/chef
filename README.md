# Code Handling and Execution Framework

CHEF is an API for executing arbitrary code securely. All the code execution is handled by docker containers
so that no malicious code can affect the host that it's running on, but it uses small containers in order to avoid long 
startup times. Adding new languages is as simple as adding a JSON object in the format of

```json
{
  "image": "image-name:version",
  "command": ["command", "to", "run", "/app/exec"]
}
```
So that it executes the code that will be placed in `/app/exec`. Small images should be prioritized.

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
  "stdin": "The standard input that will be piped in"
}
```

The stdin field is optional.