import os

# Define the base directory dynamically
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'




