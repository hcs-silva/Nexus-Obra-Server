# Changelog

## 1.0.0 (2026-03-05)


### Features

* add authentication rate limiting configuration and middleware ([34d97e5](https://github.com/hcs-silva/Nexus-Obra-Server/commit/34d97e582649a5c79ab4d2db71aca1e783e825da))
* add authentication rate limiting to user routes ([5b644a5](https://github.com/hcs-silva/Nexus-Obra-Server/commit/5b644a58e1ea127a45ca7eaa86ea202fa12be8f7))
* add Docker setup with Dockerfile and docker-compose for server and MongoDB ([949067b](https://github.com/hcs-silva/Nexus-Obra-Server/commit/949067b09072392eaea49439016c14a9d5f87552))
* add NoSQL injection protection and validate rate limiting environment variables ([d082626](https://github.com/hcs-silva/Nexus-Obra-Server/commit/d082626593df94ce3569c1d32bd7da3e143af3b1))
* add release management workflows and update release checklist ([f631bb8](https://github.com/hcs-silva/Nexus-Obra-Server/commit/f631bb82ed0baae79eddbe6929401bc04ee0dc29))
* add smoke test script and update package.json to include test command ([d4023e3](https://github.com/hcs-silva/Nexus-Obra-Server/commit/d4023e3a4f27b578ca9d28427602b3c2fa16b585))
* add validation middleware and request schemas for user and obra routes ([0acc9ab](https://github.com/hcs-silva/Nexus-Obra-Server/commit/0acc9abdf3a2b2fee7b052fa15ba7551cfcc4519))
* enhance NoSQL injection protection with request part sanitization ([8ea8a8e](https://github.com/hcs-silva/Nexus-Obra-Server/commit/8ea8a8e098b27bac4f9a5383dc09586d4c9a4c5e))
* enhance upload functionality with Cloudinary integration and update user routes for cookie-based authentication ([81b687d](https://github.com/hcs-silva/Nexus-Obra-Server/commit/81b687d95606e8be79ad940a8e2838ac6d4403cf))
* enhance user routes with safer data exposure and improved error handling ([103cac7](https://github.com/hcs-silva/Nexus-Obra-Server/commit/103cac74ca4ce0bdf089ccafc1ac1c5a93f6e6d6))
* implement database connection management and health check endpoint; enhance user routes with secure user retrieval ([a433232](https://github.com/hcs-silva/Nexus-Obra-Server/commit/a433232e13126d5071a47976c3488edcbf430550))
* implement Fatura model and add routes for managing faturas in obras ([7e7db7c](https://github.com/hcs-silva/Nexus-Obra-Server/commit/7e7db7cd339a5138bf34a28ab54bbe987f988111))
* implement logging with Winston and enhance error handling ([f075d98](https://github.com/hcs-silva/Nexus-Obra-Server/commit/f075d98d7d3bf96032cdd29cdc8b2e735b6b5fdc))
* implement rate limiting middleware and update environment configuration ([277c679](https://github.com/hcs-silva/Nexus-Obra-Server/commit/277c679832fd4188f7310afce22f68bf872a2bac))
* implement role-based access control for client routes and enhance error handling ([97196a2](https://github.com/hcs-silva/Nexus-Obra-Server/commit/97196a259e57e810a3e86659bcfe871b048305be))
* update README with new features and API endpoint details; add TypeScript and express-rate-limit dev dependencies ([5f75588](https://github.com/hcs-silva/Nexus-Obra-Server/commit/5f75588103a06a318b9ab1f01e317202ba875f69))
* update README with new features, environment variables, and endpoint details for uploads and health checks ([5744783](https://github.com/hcs-silva/Nexus-Obra-Server/commit/5744783bf564aa7451816d1ad7bc2ca7537812cf))
* update README with runtime flow details and restructure project directory; remove commented-out user route ([3b9c84c](https://github.com/hcs-silva/Nexus-Obra-Server/commit/3b9c84c63625f2d66520ac1765682d1d709ea324))
* update tsconfig.json to include forceConsistentCasingInFileNames option ([8dedcc4](https://github.com/hcs-silva/Nexus-Obra-Server/commit/8dedcc4c2c342c8059e2e88b5087066a5100233c))


### Bug Fixes

* update Dockerfile to include pnpm-workspace.yaml and adjust install flags ([7b89163](https://github.com/hcs-silva/Nexus-Obra-Server/commit/7b89163067eb45446ea93f73576463ccbc76b6d2))
* update release-please.yml to ensure correct token usage for release management ([98ca406](https://github.com/hcs-silva/Nexus-Obra-Server/commit/98ca4066d62c131d3386eafb0b1a7cc7c50bab2e))
