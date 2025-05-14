## Sensor Tower Take-Home Assignment

This is a small evaluation project for Sensor Tower.

## How to run?
1. `npm i`
2. `npm run build`
3. `node dist/run.js > log.txt`

- DEBUG environment variable for additional log output.
- It might take a second since the comparison includes Levenshtein which is n^2.
- OUTPUT
  - companies.unique.txt Companies without detected duplicates.
  - companies.duplicate.txt Companies found to have duplicates.

## Requirements
- npm (10.8.2 used for development)
- Node.js (v20.18.0 used for development)
- Mac environment used for development - your mileage may vary with Windows.
