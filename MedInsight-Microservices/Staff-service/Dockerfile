# Étape 1 : construire l'application
FROM maven:3.9.1-eclipse-temurin-20 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : exécuter l'application
FROM eclipse-temurin:20-jre-alpine
WORKDIR /app
COPY --from=build /app/target/Staff-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]

