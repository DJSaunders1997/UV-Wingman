# Step 1: Use an official Python runtime as the base image
FROM python:3.9-slim

# Step 2: Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Step 3: Install Flask directly without using requirements.txt
RUN pip install --no-cache-dir Flask

# Step 4: Create the application code directly inside the Docker image
RUN mkdir /app
WORKDIR /app

# Step 5: Add the Flask application code
RUN echo "\
from flask import Flask\n\
\n\
app = Flask(__name__)\n\
\n\
@app.route('/')\n\
def hello():\n\
    return 'Hello, World from Docker!'\n\
\n\
if __name__ == '__main__':\n\
    app.run(host='0.0.0.0', port=5000)" > /app/app.py

# Step 6: Expose the port used by the Flask application
EXPOSE 5000

# Step 7: Command to run the application
CMD ["python", "app.py"]


# Build and Run
# docker build -t flask-app .
#docker run -p 5000:5000 flask-app
