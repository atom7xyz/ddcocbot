plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.4.3"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("plugin.jpa") version "1.9.25"
    id("org.graalvm.buildtools.native") version "0.10.3"
}

group = "xyz.atom7"
version = "1.0.3"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    implementation("io.github.dehuckakpyt.telegrambot:telegram-bot-core:0.12.1")
    implementation("io.github.dehuckakpyt.telegrambot:telegram-bot-spring:0.12.1")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.github.ben-manes.caffeine:caffeine")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("ddcoc")
            mainClass.set("xyz.atom7.ddcoc.DdcocApplicationKt")

            buildArgs.addAll(
                // [Optimization and Memory Settings] ----------------------------------------
                "-O0",                      // Optimization level GraalVM should compile the image in
                "--gc=G1",                  // Select G1 garbage collector for balance between throughput/pause times
                "-H:+UnlockExperimentalVMOptions",
                "-R:MaxGCPauseMillis=100",  // Target maximum GC pause time (milliseconds)

                "-H:G1HeapRegionSize=2m",   // Memory region size for G1 collector (smaller regions
                                            // improve allocation precision but increase overhead)


                // [Build Configuration] ----------------------------------------------------
                "--enable-url-protocols=http",              // Enable HTTP URL handling (required for web apps)
                "--no-fallback",                            // Force full native build
                "-H:+ReportExceptionStackTraces",           // Show full stacktraces for build-time initialization errors

                "-H:+ReportUnsupportedElementsAtRuntime",   // Warn about reflection/JNI/resource usages
                                                            // that might fail at runtime

                "-H:+RemoveSaturatedTypeFlows",             // Aggressive optimization to eliminate redundant type checks


                // [Class Initialization] ----------------------------------------------------
                "--initialize-at-build-time=" +                         // Classes to initialize during image build
                        "org.slf4j.LoggerFactory," +                    // Logging framework initialization
                        "ch.qos.logback," +                             // Logback configuration
                        "com.fasterxml.jackson" +
                        "org.springframework.boot.SpringApplication" +  // Spring Boot startup class


                // [Native Image Diagnostics] -----------------------------------------------
                "-H:+PrintClassInitialization", // Log class initialization decisions (debugging)
                "-H:+PrintAnalysisCallTree"     // Show full call tree during static analysis
            )

            // Handle additional arguments from properties more safely
            project.findProperty("org.graalvm.buildtools.native.additionalArgs")
                ?.toString()
                ?.splitToSequence(',')  // Use comma delimiter for safer argument handling
                ?.filter { it.isNotBlank() }
                ?.forEach { buildArgs.add(it) }

            resources.autodetect()
        }
    }
}

tasks.withType<JavaCompile> {
    options.isFork = true
    options.isIncremental = true
}

tasks.withType<org.springframework.boot.gradle.tasks.bundling.BootJar> {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
