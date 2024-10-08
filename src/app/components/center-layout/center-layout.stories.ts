import type { Meta, StoryObj } from '@storybook/angular';

import { CenterLayoutComponent } from './center-layout.component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<CenterLayoutComponent> = {
  title: 'MMLI/Center Layout',
  component: CenterLayoutComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
};

export default meta;
type Story = StoryObj<CenterLayoutComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {},
};
