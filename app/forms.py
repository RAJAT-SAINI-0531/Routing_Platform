from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import SubmitField

class UserForm(FlaskForm):
    file = FileField('GeoJSON file', validators=[FileRequired(), FileAllowed(['geojson'] ,'GeoJSON file only')])
    submit = SubmitField('Upload')

