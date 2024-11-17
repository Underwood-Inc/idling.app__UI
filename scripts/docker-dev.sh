#!/bin/bash

echo "🐳 Docker Container Management"
echo "=============================="
echo
PS3="Select an action (1-5): "

select opt in "Start containers" "Stop containers" "Stop and remove all containers" "Show current containers" "Cancel"; do
  case $opt in
  "Start containers")
    echo
    echo "🚀 Starting containers..."
    docker compose up
    break
    ;;
  "Stop containers")
    echo
    echo "⏸️  Stopping containers..."
    docker compose stop
    break
    ;;
  "Stop and remove all containers")
    echo
    echo "🛑 Stopping and removing all containers..."
    docker compose down
    break
    ;;
  "Show current containers")
    echo
    echo "📊 Current containers:"
    docker compose ps
    echo
    ;;
  "Cancel")
    echo
    echo "⏹️  Operation cancelled"
    exit 0
    ;;
  *)
    echo "Invalid option. Please select 1-5"
    ;;
  esac
done
