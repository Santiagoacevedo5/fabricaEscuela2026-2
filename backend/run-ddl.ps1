# Crear la tabla reglas_reposicion en Supabase (un solo uso)
# shortcut: usa el JDBC de Maven en vez de psql (no está instalado); si cambia la BD, actualizar credenciales
$env:DB_USERNAME = 'postgres.oxwicyryqocamppenirx'
$env:DB_PASSWORD = 'slEtpnnPSOQegFhm'

Set-Location backend

# Descargar el driver si no está
$driver = "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql\42.7.7\postgresql-42.7.7.jar"
if (-not (Test-Path $driver)) {
  mvn -q dependency:copy -Dartifact=org.postgresql:postgresql:42.7.7 -DoutputDirectory="$env:TEMP\pg"
  $driver = "$env:TEMP\pg\postgresql-42.7.7.jar"
}

# Buscar cualquier postgresql jar en .m2 si la versión exacta no existe
if (-not (Test-Path $driver)) {
  $driver = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter *.jar | Select-Object -First 1 -ExpandProperty FullName
}

$sql = @"
CREATE TABLE IF NOT EXISTS reglas_reposicion (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tienda_id INTEGER NOT NULL,
    umbral_minimo INTEGER NOT NULL,
    cantidad_reposicion INTEGER NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_regla_producto FOREIGN KEY (producto_id) REFERENCES producto (id_producto),
    CONSTRAINT fk_regla_tienda FOREIGN KEY (tienda_id) REFERENCES tienda (id),
    CONSTRAINT uq_regla_producto_tienda UNIQUE (producto_id, tienda_id),
    CONSTRAINT ck_regla_valores CHECK (umbral_minimo > 0 AND cantidad_reposicion > 0)
);
"@

$tmpSql = "$env:TEMP\reglas_reposicion.sql"
Set-Content -Path $tmpSql -Value $sql -Encoding UTF8

java -cp $driver org.postgresql.util.tools 2>$null
if ($LASTEXITCODE -ne 0) {
  # Ejecutar con jshell
  $jshell = @"
import java.sql.*;
var conn = DriverManager.getConnection("jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require", System.getenv("DB_USERNAME"), System.getenv("DB_PASSWORD"));
var stmt = conn.createStatement();
stmt.execute(new java.nio.file.Files.readString(java.nio.file.Path.of("$tmpSql".replace('\','/'))));
System.out.println("OK: tabla reglas_reposicion creada");
conn.close();
/exit
"@
  Set-Content -Path "$env:TEMP\run_ddl.jsh" -Value $jshell -Encoding UTF8
  jshell --class-path $driver "$env:TEMP\run_ddl.jsh"
}
