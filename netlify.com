# Create netlify.toml configuration file
cat > netlify.toml << 'EOF'
[build]
  # This is the command Netlify runs to build your site
  command = "npm run build:web"
  
  # This is the folder Netlify will serve to visitors
  publish = "dist"
  
  # Where Netlify looks for serverless functions (optional)
  functions = "netlify/functions"

[build.environment]
  # Node.js version (18 is stable and compatible with sharp)
  NODE_VERSION = "18"
  
  # Environment for dependencies
  NODE_ENV = "production"
  
  # CRITICAL: Prevents sharp from trying to compile from source
  SHARP_IGNORE_GLOBAL_LIBVIPS = "1"

# Settings for production environment
[context.production.environment]
  NODE_ENV = "production"

# Redirect rules for Single Page App (SPA)
# All URLs redirect to index.html for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers for better protection
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking
    X-Frame-Options = "DENY"
    # Cross-site scripting protection
    X-XSS-Protection = "1; mode=block"
    # Prevent MIME type sniffing
    X-Content-Type-Options = "nosniff"
    # Referrer policy for privacy
    Referrer-Policy = "strict-origin-when-cross-origin"
    # Content Security Policy (basic - adjust as needed)
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com;"

# Cache headers for better performance
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Basic auth for staging (optional - remove for production)
# [context.deploy-preview.environment]
#   BASIC_AUTH_USER = "preview"
#   BASIC_AUTH_PASSWORD = "password"

# [context.branch-deploy.environment]
#   BASIC_AUTH_USER = "staging"
#   BASIC_AUTH_PASSWORD = "password"
EOF

echo "✅ netlify.toml created successfully!"
