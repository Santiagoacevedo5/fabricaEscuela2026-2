package com.ey.springboot3security.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ey.springboot3security.filter.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          UserDetailsService userDetailsService,
                          PasswordEncoder passwordEncoder) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    // HUS-02: la autorización se valida en el servidor en cada petición.
    // Las reglas se revisan de arriba hacia abajo y se aplica la primera que coincida,
    // por eso las más específicas van primero.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // ---------- Públicas ----------
                        .requestMatchers("/auth/welcome", "/auth/generateToken", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/resumen", "/api/resumen/**").permitAll() // pantalla de login

                        // ---------- Empleados: solo admin ----------
                        .requestMatchers("/auth/addNewUser").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/auth/users", "/auth/users/**").hasAuthority("ROLE_ADMIN")

                        // ---------- Tiendas y CD: consultar todos, registrar/editar admin ----------
                        .requestMatchers("/api/tiendas/encargados-disponibles", "/api/centros/encargados-disponibles")
                        .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/tiendas", "/api/tiendas/**", "/api/centros", "/api/centros/**")
                        .authenticated()
                        .requestMatchers("/api/tiendas", "/api/tiendas/**", "/api/centros", "/api/centros/**")
                        .hasAuthority("ROLE_ADMIN")

                        // ---------- Productos: consultar todos, registrar/editar admin y encargado de CD ----------
                        .requestMatchers(HttpMethod.GET, "/api/productos", "/api/productos/**").authenticated()
                        .requestMatchers("/api/productos", "/api/productos/**").hasAnyAuthority("ROLE_ADMIN", "ENCARGADO_CD")

                        // ---------- Inventario ----------
                        .requestMatchers("/api/inventario/capacidad").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/inventario/entradas", "/api/inventario/despachos")
                        .hasAnyAuthority("ROLE_ADMIN", "ENCARGADO_CD")
                        .requestMatchers("/api/inventario/ventas").hasAnyAuthority("ROLE_ADMIN", "ENCARGADO_TIENDA")
                        .requestMatchers(HttpMethod.POST, "/api/inventario").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/inventario", "/api/inventario/**").authenticated()

                        // Inventario por CD (HU4.3): consultar admin y encargado de CD; agregar solo admin
                        // (agrega productos sin revisar la capacidad del CD)
                        .requestMatchers(HttpMethod.GET, "/api/inventario-cd/**").hasAnyAuthority("ROLE_ADMIN", "ENCARGADO_CD")
                        .requestMatchers("/api/inventario-cd/**").hasAuthority("ROLE_ADMIN")

                        // ---------- Plantilla original ----------
                        .requestMatchers("/auth/user/**").hasAuthority("ROLE_USER")
                        .requestMatchers("/auth/admin/**").hasAuthority("ROLE_ADMIN")

                        // Todo lo demás (/auth/me, /auth/logout, ...) exige sesión
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:3000", "*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}