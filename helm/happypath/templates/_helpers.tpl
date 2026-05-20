{{/*
Expand the name of the chart.
*/}}
{{- define "happypath.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "happypath.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "happypath.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "happypath.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "happypath.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "happypath.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "happypath.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Redis selector labels
*/}}
{{- define "happypath.redis.selectorLabels" -}}
app.kubernetes.io/name: {{ include "happypath.name" . }}-redis
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
MinIO selector labels
*/}}
{{- define "happypath.minio.selectorLabels" -}}
app.kubernetes.io/name: {{ include "happypath.name" . }}-minio
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
