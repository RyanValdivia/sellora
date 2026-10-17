# Diagramas de Sellora

Se ven renderizados en GitHub, GitLab y en la mayoría de editores con soporte Mermaid.

## 1. Modelo de datos (ER)

Notas del modelo:

- **No se guarda la ubicación del cliente.** Ninguna tabla tiene campos de posición del cliente. `location` es la dirección del negocio.
- **Cliente anónimo.** `customer` solo existe si el cliente usa la app. Se crea al primer uso, sin correo ni teléfono. Quien usa solo el Wallet no tiene fila en `customer`.
- **Una tarjeta por cliente y negocio.** `pass` es única por (`business_id`, `customer_id`) cuando hay cliente.
- **Cuentas y sesiones** las gestiona Better Auth (`account`, `session`, `verification`). No se dibujan aquí.
- **`business.config`** guarda en JSON la identidad, las reglas, los mensajes y el diseño del pase. Se valida con zod en `packages/shared`.

```mermaid
erDiagram
  PLATFORM_SETTINGS {
    string key PK
    json value
    datetime updated_at
  }
  USER {
    string id PK
    string email UK
    string name
    string role "superadmin, owner, staff"
    datetime created_at
  }
  BUSINESS {
    string id PK
    string slug UK
    string name
    string plan
    boolean active
    json config "identidad, reglas, mensajes, diseno"
    datetime created_at
  }
  BUSINESS_MEMBER {
    string user_id PK, FK
    string business_id PK, FK
    string role "owner, staff"
  }
  INVITATION {
    string id PK
    string business_id FK
    string created_by FK
    string token_hash UK
    string role
    datetime expires_at
    datetime used_at
  }
  LOCATION {
    string id PK
    string business_id FK
    string label
    string address
    float lat
    float lng
    string alert_text
    int position
  }
  ASSET {
    string id PK
    string business_id FK
    string kind "logo, cover, stamp_icon"
    string storage_key
    string mime
  }
  CUSTOMER {
    string id PK
    string display_name "opcional"
    datetime created_at
  }
  PASS {
    string id PK
    string serial UK
    string auth_token
    string business_id FK
    string customer_id FK "opcional"
    string holder_name "opcional"
    int stamps
    int redemptions
    boolean reward_ready
    datetime last_stamp_at
    datetime expires_at
    datetime created_at
  }
  STAMP_EVENT {
    string id PK
    string pass_id FK
    string actor_user_id FK
    string type "stamp, redeem, adjust"
    int amount
    datetime created_at
  }
  DEVICE_REGISTRATION {
    string id PK
    string pass_id FK
    string device_library_id
    string push_token
    datetime created_at
  }
  PUSH_DEVICE {
    string id PK
    string user_id FK "opcional"
    string customer_id FK "opcional"
    string platform "ios, android"
    string token UK
    datetime created_at
  }

  BUSINESS ||--o{ LOCATION : tiene
  BUSINESS ||--o{ ASSET : sube
  BUSINESS ||--o{ BUSINESS_MEMBER : "tiene equipo"
  USER ||--o{ BUSINESS_MEMBER : pertenece
  BUSINESS ||--o{ INVITATION : emite
  USER ||--o{ INVITATION : crea
  BUSINESS ||--o{ PASS : emite
  CUSTOMER |o--o{ PASS : guarda
  PASS ||--o{ STAMP_EVENT : registra
  USER |o--o{ STAMP_EVENT : "sella o canjea"
  PASS ||--o{ DEVICE_REGISTRATION : "se registra en"
  USER |o--o{ PUSH_DEVICE : usa
  CUSTOMER |o--o{ PUSH_DEVICE : usa
```

## 2. Flujo del producto

```mermaid
flowchart TD
  subgraph D["Dueño"]
    D1["Crea su cuenta"] --> D2["Diseña la tarjeta<br/>vista previa en vivo"]
    D2 --> D3["Añade ubicaciones<br/>y textos del aviso"]
    D3 --> D4["Descarga el QR<br/>y lo pega en el mostrador"]
    D3 --> D5["Invita al personal de caja"]
  end

  subgraph C["Cliente"]
    C1["Escanea el QR del mostrador"] --> C2["Abre /b/slug"]
    C2 --> C3{"¿Tiene la app<br/>de Sellora?"}
    C3 -- "Sí" --> C4["Se abre en la app"]
    C3 -- "No" --> C5["Landing web del negocio"]
    C4 --> S1["Servidor crea el pase<br/>serial, token y QR único"]
    C5 --> S1
    S1 --> C6{"¿Dónde guarda<br/>la tarjeta?"}
    C6 -- "iPhone" --> C7["Apple Wallet"]
    C6 -- "Android" --> C8["Google Wallet"]
    C6 -- "Solo app" --> C9["Tarjeta dentro de la app"]
    C7 --> C10["El teléfono compara su posición<br/>con la del negocio, sin avisar al servidor"]
    C8 --> C10
    C10 --> C11["Aviso en la pantalla de bloqueo"]
  end

  subgraph K["Caja"]
    K1["Escanea el QR de la tarjeta"] --> K2["Servidor valida<br/>serial y negocio"]
    K2 --> K3{"¿Puede sumar?<br/>límite diario y caducidad"}
    K3 -- "No" --> K4["Muestra el motivo"]
    K3 -- "Sí" --> K5["Suma el sello y guarda el evento"]
    K5 --> K6{"¿Completó la tarjeta?"}
    K6 -- "No" --> K8["Actualiza el pase"]
    K6 -- "Sí" --> K7["Premio listo para canjear"]
    K7 --> K9["Canjear: reinicia los sellos"]
    K7 --> K8
    K9 --> K8
  end

  D4 -.-> C1
  D5 -.-> K1
  C11 -.->|"va al local y muestra la tarjeta"| K1
  K8 --> P["Push: APNs, Google Wallet o FCM"]
  P --> C12["Cliente ve: Ahora tienes 5/6 sellos"]
```

## 3. Alta de la tarjeta y registro del dispositivo

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Web as Landing /b/slug
  participant API as API Sellora
  participant DB as Base de datos
  participant Wallet as Apple Wallet

  Cliente->>Web: Toca "Añadir a Apple Wallet"
  Web->>API: GET /api/passes/{slug}/pkpass
  API->>DB: Crea pass con serial y auth_token
  API-->>Web: .pkpass firmado con relevantLocations
  Web-->>Wallet: Abre el pase
  Wallet->>Cliente: Guarda la tarjeta
  Wallet->>API: POST /v1/devices/{id}/registrations/{tipo}/{serial}
  API->>DB: Guarda device_registration con push_token
  Note over Wallet,Cliente: La posición del cliente se compara solo en el teléfono
```

## 4. Sumar un sello y actualizar el pase

```mermaid
sequenceDiagram
  autonumber
  actor Cajero
  participant App as App de caja
  participant API as API Sellora
  participant DB as Base de datos
  participant Push as APNs o Google Wallet
  participant Tel as Teléfono del cliente

  Cajero->>App: Escanea el QR de la tarjeta
  App->>API: POST /api/passes/{serial}/stamp
  API->>DB: Lee pase, negocio y reglas
  API->>API: Valida límite diario y caducidad
  API->>DB: Guarda sellos y stamp_event
  API-->>App: 5/6 sellos, premio aún no listo
  API->>Push: Push al push_token registrado
  Push->>Tel: Aviso de actualización
  Tel->>API: GET /v1/passes/{tipo}/{serial}
  API-->>Tel: Pase actualizado
  Tel->>Tel: Muestra "Ahora tienes 5/6 sellos"
```
