/**
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";

import { SubtitleWarningDescriptor } from "../settings/descriptors/subtitleWarningDescriptor";
import { IVisualComponentConstructorOptions } from "./visualComponentConstructorOptions";

import {
    ISubtitleComponentRenderOptions,
    SubtitleComponent,
} from "./subtitleComponent";

export interface ISubtitleWarningComponentRenderOptions extends ISubtitleComponentRenderOptions {
    warningState: number;
    dateDifference: number;
    settings: SubtitleWarningDescriptor;
}

export class SubtitleWarningComponent extends SubtitleComponent {
    private warningSelector: CssConstants.ClassAndSelector = this.getSelectorWithPrefix("warning");
    private dataAgeSelector: CssConstants.ClassAndSelector = this.getSelectorWithPrefix("dataAge");

    constructor(options: IVisualComponentConstructorOptions) {
        super(options);

        this.element.classed(this.getClassNameWithPrefix("subtitleWarningComponent"), true);
    }

    public render(options: ISubtitleWarningComponentRenderOptions): void {
        const {
            settings,
            warningState,
            dateDifference,
        } = options;

        this.renderIcon(
            warningState > 0 ? settings.warningText : null,
            this.warningSelector,
        );

        super.render(options);

        this.renderIcon(
            `Data is ${dateDifference} days old. ${settings.staleDataText}`,
            this.dataAgeSelector,
        );
    }

    private renderIcon(
        title: string,
        selector: CssConstants.ClassAndSelector,
    ): void {
        const iconSelection: Selection<any, string, any, any> = this.element
            .selectAll(selector.selectorName)
            .data(title ? [title] : []);

        iconSelection
            .exit()
            .remove();

        iconSelection
            .enter()
            .append("div")
            .classed(selector.className, true)
            .merge(iconSelection)
            .attr("title", (titleData: string) => titleData);
    }
}
