terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  # Pour un vrai projet d'équipe, on utiliserait un backend S3.
  # Ici on reste en local pour débuter.
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "kubernetes" {
  # En local, utilise ~/.kube/config
  # En CI/CD, on passera les variables d'environnement ou le fichier config
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "medinsight" {
  metadata {
    name = "medinsight"
    labels = {
      environment = "production"
      managed_by  = "terraform"
    }
  }
}

resource "kubernetes_limit_range" "medinsight_limits" {
  metadata {
    name      = "medinsight-limits"
    namespace = kubernetes_namespace.medinsight.metadata[0].name
  }

  spec {
    limit {
      type = "Container"
      default = {
        cpu    = "500m"
        memory = "512Mi"
      }
      default_request = {
        cpu    = "100m"
        memory = "128Mi"
      }
    }
  }
}
