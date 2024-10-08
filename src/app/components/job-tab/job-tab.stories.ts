import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { JobTabComponent } from './job-tab.component';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<JobTabComponent> = {
  title: 'MMLI/Job Tab',
  component: JobTabComponent,
  tags: ['autodocs'],
  argTypes: {
    tab: {
      control: {
        type: 'select',
        options: ['input', 'result'],
      },
    },
  },
  args: {},
  decorators: [
    moduleMetadata({
      imports: [RouterModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {},
            params: of({}),
          },
        },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<JobTabComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    tab: 'input',
  },
};
