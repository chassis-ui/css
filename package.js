// package metadata file for Meteor.js

/* globals Package */

Package.describe({
  name: 'chassisui:chassis-css',
  summary: 'A CSS framework which synchronizes with Figma components by using design tokens.',
  version: '0.1.2',
  git: 'https://github.com/chassis-ui/css.git'
})

Package.onUse((api) => {
  api.versionsFrom('METEOR@1.0')
  api.addFiles(['dist/css/chassis.css', 'dist/js/chassis.js'], 'client')
})
