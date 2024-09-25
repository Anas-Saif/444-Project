FROM python:3.12-slim

EXPOSE 8000
EXPOSE 8080

RUN mkdir /backend
WORKDIR /backend

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install pip requirements
COPY ./backend/requirements.txt .
RUN python -m pip install -r requirements.txt

COPY . .


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]


