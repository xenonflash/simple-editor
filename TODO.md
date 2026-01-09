# Low-Code Platform Roadmap & TODOs

## In Progress: Standardize Component Events
- [x] **Data Design**: `src/types/event.ts` (Event schema), `src/components/comps/atomConfig.ts` (Atom events), `src/config/naive-ui-registry.ts` (Naive events)
- [ ] **Runtime Logic**: `src/runtime/useComponentEvents.ts` (Generic event handler composed)
- [ ] **UI Integration**: Update `EventTab.vue` to read from new config & `ComponentRenderer.vue` to bind events.

## P0: Core Data Engine (核心数据引擎)
- [ ] **Dynamic Data Modeling**
  - [ ] Implement backend service to create/edit database schemas dynamically (DDL generation).
  - [ ] Create frontend UI for "Data Modeling" (Tables, Columns, Relationships).
- [ ] **Universal CRUD API**
  - [ ] Auto-generate REST/GraphQL APIs for user-defined data models.
  - [ ] Implement query filtering, pagination, and sorting on the server side.
- [ ] **Data Binding System**
  - [ ] Enhance property panel to support binding component props to data sources (variables, API results, table rows).

## P1: Extensibility & Runtime (扩展性与运行时)
- [ ] **Remote Component Loading**
  - [ ] Refactor component registry to load components (UMD/ESM) from remote URLs.
  - [ ] Create a CLI or mechanism for developers to build and publish custom component packages.
- [ ] **Advanced Layouts**
  - [ ] Implement Grid layout system.
  - [ ] Add Tabs, Collapse, and Split Panel containers.
- [ ] **Responsive Design**
  - [ ] Add breakpoint configuration (Mobile/Tablet/Desktop).
  - [ ] Allow styling overrides per breakpoint.

## P2: Server-Side Logic & Workflow (服务端逻辑)
- [ ] **Server-Side Actions**
  - [ ] Mechanism to define secure server-side logic (Node.js/Python scripts).
  - [ ] Secure Sandbox environment (vm2 / isolated containers) for execution.
- [ ] **Flow Engine Backend**
  - [ ] Move critical logic flows from client-side execution to server-side execution.
  - [ ] Support Triggers (Cron jobs, Database Webhooks).

## P3: DevOps & ALM (全生命周期管理)
- [ ] **Versioning**
  - [ ] Application change history and rollback capability.
- [ ] **Environment Management**
  - [ ] Separate configs for Dev, Staging, and Production environments.
- [ ] **Deployment**
  - [ ] One-click publish (build static assets + config).

## P4: Security (安全)
- [ ] **RBAC**
  - [ ] Role-based access control for pages and actions.
- [ ] **Row-Level Security**
  - [ ] Define data access policies (e.g., users can only see their own records).

## Current Tech Debt (当前技术债)
- [ ] **Refactor `Board.vue`**: Continue extracting logic into Composables (DONE: Zoom, DragDrop).
- [ ] **Standardize Component Events**: Ensure all components (Atom & Naive) emit standard lifecycle and interaction events.
