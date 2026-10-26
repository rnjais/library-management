# ==============================================================================
# Stage 1: Build Application
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven POM file and pre-fetch dependencies for Docker caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code
COPY src ./src

# Package production executable JAR (skipping tests during Docker image build)
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal Production JRE Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Create an unprivileged system user and group for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy packaged JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to unprivileged non-root user
USER appuser

# Expose default Spring Boot HTTP port
EXPOSE 8080

# Configure container-aware JVM flags
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
