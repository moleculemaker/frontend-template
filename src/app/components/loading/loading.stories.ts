import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { LoadingComponent } from './loading.component';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<LoadingComponent> = {
  title: 'MMLI/Template/Loading',
  component: LoadingComponent,
  tags: ['autodocs'],
  argTypes: {},
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
type Story = StoryObj<LoadingComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {},
};
