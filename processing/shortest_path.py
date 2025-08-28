"""
Model exported as python.
Name : Shortest path (point to layer)_ZipCodes_v5
Group : OSM
With QGIS : 32216
"""

from qgis.core import QgsProcessing
from qgis.core import QgsProcessingAlgorithm
from qgis.core import QgsProcessingMultiStepFeedback
from qgis.core import QgsProcessingParameterNumber
from qgis.core import QgsProcessingParameterString
from qgis.core import QgsProcessingParameterMapLayer
from qgis.core import QgsProcessingParameterFeatureSink
from qgis.core import QgsCoordinateReferenceSystem
import processing


class ShortestPathPointToLayer_zipcodes_v5(QgsProcessingAlgorithm):
    output_crs = QgsCoordinateReferenceSystem('EPSG:4326')

    def initAlgorithm(self, config=None):
        self.addParameter(QgsProcessingParameterNumber('pathtypetocalculate0shortest1fastest', 'Path type to calculate (0 — Shortest, 1 — Fastest)', type=QgsProcessingParameterNumber.Integer, minValue=0, maxValue=1, defaultValue=1))
        self.addParameter(QgsProcessingParameterString('pathtypetocalculatetypeshortestorfastest', 'Path type to calculate (type: Shortest or Fastest)', multiLine=False, defaultValue='Fastest'))
        self.addParameter(QgsProcessingParameterMapLayer('roadclassification (16)', 'FINAL_network', defaultValue=None, types=[QgsProcessing.TypeVectorLine]))
        self.addParameter(QgsProcessingParameterMapLayer('roadclassification (16) (2)', 'Zip_codes', defaultValue=None, types=[QgsProcessing.TypeVectorPoint]))
        self.addParameter(QgsProcessingParameterMapLayer('roadclassification (16) (2) (2)', 'STARTING_point', defaultValue=None, types=[QgsProcessing.TypeVectorPoint]))
        self.addParameter(QgsProcessingParameterNumber('speedvalue', 'Speed value', type=QgsProcessingParameterNumber.Integer, minValue=5, maxValue=150, defaultValue=50))
        self.addParameter(QgsProcessingParameterNumber('speedvalue (2)', 'Topology tolerance (m)', type=QgsProcessingParameterNumber.Integer, minValue=0, maxValue=15, defaultValue=5))
        self.addParameter(QgsProcessingParameterFeatureSink('FieldCalculatorLength', 'Field calculator (length)', type=QgsProcessing.TypeVectorAnyGeometry, createByDefault=True, supportsAppend=True, defaultValue=None))
        self.addParameter(QgsProcessingParameterFeatureSink('FinalShortestPath', 'Final Shortest Path', type=QgsProcessing.TypeVectorAnyGeometry, createByDefault=True, supportsAppend=True, defaultValue=None))
        self.addParameter(QgsProcessingParameterFeatureSink('ShortestPathPointToLayer', 'Shortest path (point to layer)', type=QgsProcessing.TypeVectorLine, createByDefault=True, defaultValue=None))

    def processAlgorithm(self, parameters, context, model_feedback):
        # Use a multi-step feedback, so that individual child algorithm progress reports are adjusted for the
        # overall progress through the model
        feedback = QgsProcessingMultiStepFeedback(7, model_feedback)
        results = {}
        outputs = {}

        # Mean coordinate(s)
        alg_params = {
            'INPUT': parameters['roadclassification (16) (2) (2)'],
            'UID': '',
            'WEIGHT': '',
            'OUTPUT': QgsProcessing.TEMPORARY_OUTPUT
        }
        outputs['MeanCoordinates'] = processing.run('native:meancoordinates', alg_params, context=context, feedback=feedback, is_child_algorithm=True)

        feedback.setCurrentStep(1)
        if feedback.isCanceled():
            return {}

        # Field calculator (coordinates X,Y)
        alg_params = {
            'FIELD_LENGTH': 0,
            'FIELD_NAME': 'coordinates',
            'FIELD_PRECISION': 0,
            'FIELD_TYPE': 2,  # String
            'FORMULA': "eval (' MEAN_X  || '','' ||  MEAN_Y ')",
            'INPUT': outputs['MeanCoordinates']['OUTPUT'],
            'OUTPUT': QgsProcessing.TEMPORARY_OUTPUT
        }
        outputs['FieldCalculatorCoordinatesXy'] = processing.run('native:fieldcalculator', alg_params, context=context, feedback=feedback, is_child_algorithm=True)

        feedback.setCurrentStep(2)
        if feedback.isCanceled():
            return {}

        # List unique values (coordinates X,Y)
        alg_params = {
            'FIELDS': ['coordinates'],
            'INPUT': outputs['FieldCalculatorCoordinatesXy']['OUTPUT']
        }
        outputs['ListUniqueValuesCoordinatesXy'] = processing.run('qgis:listuniquevalues', alg_params, context=context, feedback=feedback, is_child_algorithm=True)

        feedback.setCurrentStep(3)
        if feedback.isCanceled():
            return {}

        # Shortest path (point to layer) (Fastest)
        alg_params = {
            'DEFAULT_DIRECTION': 2,  # Both directions
            'DEFAULT_SPEED': parameters['speedvalue'],
            'DIRECTION_FIELD': 'oneway',
            'END_POINTS': parameters['roadclassification (16) (2)'],
            'INPUT': parameters['roadclassification (16)'],
            'SPEED_FIELD': 'speed_class',
            'START_POINT': outputs['ListUniqueValuesCoordinatesXy']['UNIQUE_VALUES'],
            'STRATEGY': parameters['pathtypetocalculate0shortest1fastest'],
            'TOLERANCE': parameters['speedvalue (2)'],
            'VALUE_BACKWARD': '',
            'VALUE_BOTH': '',
            'VALUE_FORWARD': 'yes',
            'OUTPUT': parameters['ShortestPathPointToLayer']
        }
        outputs['ShortestPathPointToLayerFastest'] = processing.run('native:shortestpathpointtolayer', alg_params, context=context, feedback=feedback, is_child_algorithm=True)
        results['ShortestPathPointToLayer'] = outputs['ShortestPathPointToLayerFastest']['OUTPUT']

        feedback.setCurrentStep(4)
        if feedback.isCanceled():
            return {}

        # Reproject layer
        alg_params = {
            'INPUT': outputs['ShortestPathPointToLayerFastest']['OUTPUT'],
            'OPERATION': '',
            'TARGET_CRS': QgsCoordinateReferenceSystem('EPSG:4326'),
            'OUTPUT': QgsProcessing.TEMPORARY_OUTPUT
        }
        outputs['ReprojectLayer'] = processing.run('native:reprojectlayer', alg_params, context=context, feedback=feedback, is_child_algorithm=True)

        feedback.setCurrentStep(5)
        if feedback.isCanceled():
            return {}

        # Field calculator (length)
        alg_params = {
            'FIELD_LENGTH': 0,
            'FIELD_NAME': 'length',
            'FIELD_PRECISION': 2,
            'FIELD_TYPE': 0,  # Float
            'FORMULA': '$length',
            'INPUT': outputs['ReprojectLayer']['OUTPUT'],
            'OUTPUT': parameters['FieldCalculatorLength']
        }
        outputs['FieldCalculatorLength'] = processing.run('native:fieldcalculator', alg_params, context=context, feedback=feedback, is_child_algorithm=True)
        results['FieldCalculatorLength'] = outputs['FieldCalculatorLength']['OUTPUT']

        feedback.setCurrentStep(6)
        if feedback.isCanceled():
            return {}

        # Retain fields
        # De pastrat fieldurile dorite
        alg_params = {
            'FIELDS': ['start','end','postcode','city','address','length'],
            'INPUT': outputs['FieldCalculatorLength']['OUTPUT'],
            'OUTPUT': parameters['FinalShortestPath']
        }
        outputs['RetainFields'] = processing.run('native:retainfields', alg_params, context=context, feedback=feedback, is_child_algorithm=True)
        results['FinalShortestPath'] = outputs['RetainFields']['OUTPUT']
        return results

    def name(self):
        return 'Shortest path (point to layer)_ZipCodes_v5'

    def displayName(self):
        return 'Shortest path (point to layer)_ZipCodes_v5'

    def group(self):
        return 'OSM'

    def groupId(self):
        return 'OSM'

    def createInstance(self):
        return ShortestPathPointToLayer_zipcodes_v5()
