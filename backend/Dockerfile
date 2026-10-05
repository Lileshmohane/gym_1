# Matches the Deployment Document, Section 2.1. Build the jar first: ./mvnw -DskipTests package
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/gym-saas-backend.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
