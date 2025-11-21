#!/bin/bash

echo "Installing packages with legacy peer dependencies..."

echo "Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..

echo "Installing teacher attendance frontend dependencies..."
cd teacher-attendance-frontend
npm install --legacy-peer-deps
cd ..

echo "Installing super admin dashboard dependencies..."
cd super-admin-dashboard
npm install --legacy-peer-deps
cd ..

echo "All packages installed successfully!"