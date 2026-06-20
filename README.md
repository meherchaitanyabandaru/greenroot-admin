# GreenRoot Admin

GreenRoot Admin is the internal administration portal used to manage nurseries, users, subscriptions, dispatch operations, support requests, and platform analytics.

---

## Overview

The Admin Portal provides operational visibility and management capabilities for the GreenRoot platform.

The portal is used by:

* Super Administrators
* Support Team
* Operations Team
* Business Team

---

## Responsibilities

### Nursery Management

* Approve Nurseries
* Suspend Nurseries
* Activate Nurseries
* View Nursery Details
* Subscription Monitoring

---

### User Management

Manage:

* Owners
* Gumastas
* Drivers

Features:

* User Search
* User Status
* User Activity
* Device Information

---

### Dispatch Monitoring

View:

* Active Dispatches
* In Transit Trips
* Delivered Trips
* Cancelled Trips

---

### Trip Tracking

Monitor:

* Driver Locations
* Vehicle Movement
* Trip Progress
* GPS Activity

---

### Subscription Management

Manage:

* Free Plans
* Basic Plans
* Premium Plans
* Enterprise Plans

Features:

* Plan Assignment
* Renewal Tracking
* Payment Status

---

### Analytics Dashboard

Metrics:

* Total Nurseries
* Active Users
* Active Trips
* Delivered Trips
* Daily Dispatch Count
* Monthly Growth

---

### Support Tools

Support Team can:

* Search Users
* Search Trips
* View Audit Logs
* Investigate Issues
* Resolve Customer Requests

---

### Audit Monitoring

Track:

* Login Activity
* User Actions
* Dispatch Changes
* Subscription Changes
* Security Events

---

## Technology Stack

### Frontend

Next.js

### Language

TypeScript

### UI Framework

Tailwind CSS

### State Management

TanStack Query

### Authentication

JWT

### Charts

Recharts

---

## Architecture

Admin Portal
↓
GreenRoot API
↓
PostgreSQL

---

## Project Structure

src/

├── app/
├── components/
├── modules/
│
├── dashboard/
├── nurseries/
├── users/
├── dispatches/
├── trips/
├── subscriptions/
├── analytics/
├── support/
├── audit/
│
├── services/
├── hooks/
├── utils/
└── types/

---

## Dashboard Modules

### Operations Dashboard

Displays:

* Active Trips
* Pending Deliveries
* GPS Status
* Dispatch Activity

---

### Business Dashboard

Displays:

* Revenue
* Subscription Growth
* Active Nurseries
* Monthly Metrics

---

### Support Dashboard

Displays:

* Open Tickets
* User Issues
* Driver Issues
* Dispatch Issues

---

## Security

* Role Based Access Control
* JWT Authentication
* Audit Logging
* IP Tracking
* Session Management

---

## Environments

### Development

DEV

### Production

PROD

---

## Future Roadmap

### V1

* Nursery Management
* User Management
* Dispatch Monitoring

### V2

* Business Analytics
* Customer Insights
* Growth Metrics

### V3

* Marketplace Operations
* AI Analytics
* Demand Forecasting

---

## Product Vision

GreenRoot Admin provides operational control and visibility across the entire GreenRoot ecosystem.
