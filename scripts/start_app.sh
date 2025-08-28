#!/bin/bash

source /home/pgs_admin/miniconda3/etc/profile.d/conda.sh
conda activate flaskenv

export FLASK_APP=test.py
flask run