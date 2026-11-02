package com.railway.reservation.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Database configuration for Oracle JDBC connection.
 * Pure JDBC configuration without JPA or Hibernate.
 */
@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:jdbc:oracle:thin:@localhost:1521/XEPDB1}")
    private String dbUrl;

    @Value("${spring.datasource.username:railway_user}")
    private String username;

    @Value("${spring.datasource.password:railway_pass}")
    private String password;

    @Value("${spring.datasource.driver-class-name:oracle.jdbc.OracleDriver}")
    private String driverClassName;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int maxPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:2}")
    private int minIdle;

    @Value("${spring.datasource.hikari.idle-timeout:30000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.connection-timeout:20000}")
    private long connectionTimeout;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        config.setMaximumPoolSize(maxPoolSize);
        config.setMinimumIdle(minIdle);
        config.setIdleTimeout(idleTimeout);
        config.setConnectionTimeout(connectionTimeout);
        config.setPoolName("RailwayOracleHikariPool");

        // Oracle-specific Hikari optimizations
        config.addDataSourceProperty("oracle.jdbc.timezoneAsRegion", "false");
        config.addDataSourceProperty("remarksReporting", "false");

        return new HikariDataSource(config);
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        // Ensure queries fetch results promptly
        jdbcTemplate.setFetchSize(100);
        return jdbcTemplate;
    }
}
