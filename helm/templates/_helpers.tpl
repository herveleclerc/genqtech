{{/*
Génère le nom complet du chart.
Nous tronquons à 63 caractères car c'est la limite de longueur pour les noms d'objets Kubernetes.
Si le nom du chart est trop long, il sera remplacé par le nom complet qui est tronqué.
*/}}
{{- define "genqtech-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Génère les labels standards du chart.
*/}}
{{- define "genqtech-app.labels" -}}
helm.sh/chart: {{ include "genqtech-app.name" . }}-{{ .Chart.Version }}
{{ include "genqtech-app.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Génère les labels de sélecteur.
Ceux-ci sont utilisés par le `Deployment` et le `Service` pour identifier les pods.
*/}}
{{- define "genqtech-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "genqtech-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Génère le nom du chart.
*/}}
{{- define "genqtech-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}
