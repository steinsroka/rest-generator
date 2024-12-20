# rest-generator

rest-generator for jnpmedi

## Installation

```bash
npm install rest-interface-generator --save-dev
```

## Usage

### As a CLI tool

```bash
npx rest-generate
```

## Configuration

Add to your package.json:

```json
{
  "scripts": {
    "generate-api": "rest-generate my-service ./src/controllers/MyController.ts"
  }
}
```

## Environment Variables

Required environment variables:

- YOUR_API_ENDPOINT: The base URL for your API

## Features

- Generates maven-rest interfaces (rest, flax, url)
