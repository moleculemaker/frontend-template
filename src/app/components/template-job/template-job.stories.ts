import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TemplateJobComponent } from './template-job.component';
import { sharedDecorators, sharedModules } from '~/stories/storybook.config';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<TemplateJobComponent> = {
    title: 'MMLI/Template/Job',
    component: TemplateJobComponent,
    tags: ['autodocs'],
    argTypes: {},
    args: {},
    decorators: [
        ...sharedDecorators,
        moduleMetadata({
            imports: [
                ...sharedModules,
                CommonModule,
                ReactiveFormsModule,
                InputTextModule,
                CheckboxModule,
                ButtonModule,
            ],
        }),
    ],
};

export default meta;
type Story = StoryObj<TemplateJobComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
    args: {},
};
