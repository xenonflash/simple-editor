import type { Component } from 'vue'
import Container from './Container.vue'
import Text from './Text.vue'
import Button from './Button.vue'
import List from './List.vue'
import NaiveWrapper from './NaiveWrapper.vue'

export const componentRegistry: Record<string, Component> = {
  container: Container,
  text: Text,
  button: Button,
  list: List
}

export function resolveComponent(type: string): Component | null {
  if (componentRegistry[type]) {
    return componentRegistry[type]
  }
  if (type.startsWith('n-')) {
    return NaiveWrapper
  }
  return null
}

export function registerComponent(type: string, component: Component) {
  componentRegistry[type] = component
}
