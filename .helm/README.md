# Helm setup

The file `values-local.yaml` is git ignored so it can be used with sensitive data.

### Install the chart (using values-local.yaml from local machine)
```
helm install -f .helm/values-local.yaml movie-info-bot ./.helm --atomic --debug --namespace movie-info-bot --create-namespace
```

### Upgrade the chart
```
helm upgrade -f .helm/values-local.yaml movie-info-bot ./.helm --atomic --debug --reuse-values
```

### Uninstall
```
helm uninstall movie-info-bot --namespace movie-info-bot
```