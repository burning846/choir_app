#!/bin/bash
# Helper script to start the development server with local node runtime
export PATH=$PWD/node-runtime/bin:$PATH
cd web
npm run dev
