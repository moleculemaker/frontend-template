import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { TemplateJobResultComponent } from './template-job-result.component';
import { ActivatedRoute } from '@angular/router';
import { TestService } from '~/app/services/test.service';
import { sharedDecorators, sharedModules, sharedProviders, MockTestService } from '~/stories/storybook.config';
import { LoadingComponent } from '../loading/loading.component';

type TestCase = 'error' | 'queued' | 'processing' | 'completed';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<TemplateJobResultComponent> = {
  title: 'MMLI/Template/Job Result',
  component: TemplateJobResultComponent,
  tags: ['autodocs'],
  decorators: [
    ...sharedDecorators,
    moduleMetadata({
      imports: [
        ...sharedModules,
        LoadingComponent,
      ],
      providers: [
        ...sharedProviders,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'example-id',
              },
            },
          },
        },
        {
          provide: TestService,
          useFactory: (testCase: TestCase) => new MockTestService(testCase),
        },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<TemplateJobResultComponent>;

// Helper function to create a story with a specific test case
const createStory = (testCase: TestCase): Story => ({
  args: {},
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TestService,
          useFactory: () => new MockTestService(testCase),
        },
      ],
    }),
  ],
});

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Queued: Story = createStory('queued');

export const Processing: Story = createStory('processing');

export const Completed: Story = createStory('completed');

export const Error: Story = createStory('error');
