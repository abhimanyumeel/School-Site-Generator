# School Website CMS

## Static

- Schema jsons
- Page wise input config
- About Us
- Contact Us
- Home
- Mandatory Disclosure
- Privacy Policy
- Terms and Conditions
- Disclaimer
- Sitemap
- Footer
- Header
- 404

## Dynamic

- TCs
- Gallary
- Events
- News
- Notice Board
- Blogs (Internal Engine)
- Careers

## Database

- Template 
  - Page 
    - Fields
  
## Schema

- Pages
  - Home
    - Hero
      - Title
      - Description
      - Image Set for Carousel
    - General Numbers
      - Students
        - Number
      - Teachers
        - Number
      - Alumni
        - Number
    - Testimonials
      - Array of Testimonials
        - Name
        - Designation
        - Image
        - Description

    - About
      - Title
      - Description
      - Image

# Tables

- Themes
  - id
  - name
  - schema
  - createdAt
  - updatedAt
- Schools
  - id
  - name
  - schoolGroupId
  - createdAt
  - updatedAt
- School Groups
  - id
  - name
  - createdAt
  - updatedAt
- Users
  - id
  - name
  - email
  - password
  - phone
  - entityType
  - entityId
  - role
  - createdAt
  - updatedAt
- Documents
  - id
  - createdAt
  - updatedAt
  - type
  - path
  - url
  - order
  - name
  - mimeType
  - documentGroupId
- DocumentGroups
  - id
  - accessor
  - createdAt
  - updatedAt
  - schoolWebsiteId
- SchoolWebsites
  - id
  - name
  - createdAt
  - updatedAt
  - schoolId
  - themeId
  - data
  - version
  - remarks
  - status (active, inactive)
- FormSubmission
  - id
  - schoolWebsiteId
  - type
  - data
  - createdAt
  - updatedAt
