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

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import powerbi from "powerbi-visuals-api";

import { BaseContainerComponent } from "../baseContainerComponent";
import { IVisualComponent } from "../visualComponent";
import { IVisualComponentConstructorOptions } from "../visualComponentConstructorOptions";

import {
    IDataRepresentation,
    IDataRepresentationPoint,
    IDataRepresentationSeries,
    ViewportSize,
} from "../../converter/data/dataRepresentation";

import { DataFormatter } from "../../converter/data/dataFormatter";

import { EventName } from "../../event/eventName";

import { ISubtitleComponentRenderOptions } from "../subtitleComponent";

import { SubtitleDescriptor } from "../../settings/descriptors/subtitleDescriptor";

import { SubtitleComponent } from "../subtitleComponent";
import { PlotComponent } from "./plotComponent";

export interface ISparklineComponentRenderOptions {
    series: IDataRepresentationSeries[];
    current: IDataRepresentationSeries;
    dataRepresentation: IDataRepresentation;
    viewport: powerbi.IViewport;
    position: number;
}

export class SparklineComponent extends BaseContainerComponent<IVisualComponentConstructorOptions, ISparklineComponentRenderOptions, any> {
    private className: string = "sparklineComponent";

    private topLabelComponent: IVisualComponent<ISubtitleComponentRenderOptions>;
    private plotComponent: IVisualComponent<any>;
    private bottomLabelComponent: IVisualComponent<ISubtitleComponentRenderOptions>;

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.initElement(
            options.element,
            this.className,
        );

        this.constructorOptions = {
            ...options,
            element: this.element,
        };

        this.element.on("click", () => {
            const event: MouseEvent = require("d3").event;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            this.constructorOptions.eventDispatcher[EventName.onChartChangeClick](
                this.renderOptions && this.renderOptions.current && this.renderOptions.current.name,
            );
        });

        this.constructorOptions.eventDispatcher.on(
            `${EventName.onCurrentDataPointIndexChange}.${this.className}.${options.id}`,
            this.onCurrentDataPointIndexChange.bind(this),
        );

        this.constructorOptions.eventDispatcher.on(
            `${EventName.onCurrentDataPointIndexReset}.${this.className}.${options.id}`,
            this.onCurrentDataPointIndexChange.bind(this),
        );
    }

    public initialize(): void {
        this.topLabelComponent = new SubtitleComponent(this.constructorOptions);
        this.plotComponent = new PlotComponent(this.constructorOptions);
        this.bottomLabelComponent = new SubtitleComponent(this.constructorOptions);

        this.components = [
            this.topLabelComponent,
            this.plotComponent,
            this.bottomLabelComponent,
        ];
    }

    public render(options: ISparklineComponentRenderOptions) {
        this.renderOptions = options;

        const {
            current,
            series,
            viewport,
            position,
        } = this.renderOptions;

        this.updateSize(viewport.width, viewport.height);

        this.updateElementOrder(this.element, position);

        this.element.attr(
            "title",
            current && current.formattedTooltip || null,
        );

        if (current && series) {
            if (!this.components.length) {
                this.initialize();
            }

            this.renderComponent(this.renderOptions);
        } else {
            this.destroyComponents();
        }
    }

    public renderComponent(options: ISparklineComponentRenderOptions) {
        const {
            current,
            dataRepresentation: {
                viewportSize,
            },
        } = options;

        this.renderOptions = options;

        this.renderTopLabel(current.name, viewportSize, current.settings.sparklineLabel);
        this.renderBottomLabel(current.current.y, viewportSize, current.settings.sparklineValue);
        this.renderPlot(options);
    }

    public destroy(): void {
        super.destroy();

        this.topLabelComponent = null;
        this.plotComponent = null;
        this.bottomLabelComponent = null;

        this.components = [];
    }

    private onCurrentDataPointIndexChange(index: number): void {
        const current: IDataRepresentationPoint = this.renderOptions
            && this.renderOptions.current
            && this.renderOptions.current.points
            && this.renderOptions.current.points[index];

        const sparklineValue: SubtitleDescriptor = this.renderOptions
            && this.renderOptions.current
            && this.renderOptions.current.settings
            && this.renderOptions.current.settings.sparklineValue;

        const viewportSize: ViewportSize = this.renderOptions
            && this.renderOptions.dataRepresentation
            && this.renderOptions.dataRepresentation.viewportSize;

        if (current && sparklineValue) {
            setTimeout(this.renderBottomLabel.bind(this, current.y, viewportSize, sparklineValue));
        }
    }

    private renderTopLabel(
        name: string,
        viewportSize: ViewportSize,
        settings: SubtitleDescriptor,
    ): void {
        const fontSize: number = this.getFontSizeByViewportSize(viewportSize);

        settings.titleText = name;
        settings.autoFontSizeValue = fontSize;

        this.topLabelComponent.render({ settings });
    }

    private renderBottomLabel(
        value: number,
        viewportSize: ViewportSize,
        settings: SubtitleDescriptor,
    ): void {
        const fontSize: number = this.getFontSizeByViewportSize(viewportSize);
        const actualValueKPIFontSize: number = fontSize * this.getActualValueKPIFactorByViewportSize(viewportSize);

        const formatter: valueFormatter.IValueFormatter = DataFormatter.getValueFormatter(
            value,
            settings,
        );

        settings.titleText = formatter.format(value);
        settings.autoFontSizeValue = actualValueKPIFontSize;

        this.bottomLabelComponent.render({ settings });
    }

    private renderPlot(options: ISparklineComponentRenderOptions): void {
        const plotComponentViewport: powerbi.IViewport = this.getReducedViewport(
            { ...options.viewport },
            [this.topLabelComponent, this.bottomLabelComponent],
        );

        this.plotComponent.render({
            ...options,
            viewport: plotComponentViewport,
        });
    }

    private getFontSizeByViewportSize(viewportSize: ViewportSize): number {
        switch (viewportSize) {
            case ViewportSize.tiny: {
                return 6;
            }
            case ViewportSize.small: {
                return 9;
            }
            case ViewportSize.normal: {
                return 14;
            }
            case ViewportSize.medium: {
                return 18;
            }
            case ViewportSize.big: {
                return 20;
            }
            case ViewportSize.big: {
                return 24;
            }
        }

        return 28;
    }

    private getActualValueKPIFactorByViewportSize(viewportSize: ViewportSize): number {
        switch (viewportSize) {
            case ViewportSize.tiny: {
                return 1;
            }
            default: {
                return 1.5;
            }
        }
    }

    private getReducedViewport(viewport: powerbi.IViewport, components: Array<IVisualComponent<any>>): powerbi.IViewport {
        return components.reduce<powerbi.IViewport>((
            previousViewport: powerbi.IViewport,
            component: IVisualComponent<any>,
        ): powerbi.IViewport => {
            const componentViewport: powerbi.IViewport = component.getViewport();

            return {
                height: previousViewport.height - componentViewport.height,
                width: previousViewport.width,
            };
        }, viewport);
    }

    private destroyComponents(): void {
        this.forEach(
            this.components.splice(0, this.components.length),
            (component: IVisualComponent<{}>) => {
                component.destroy();
            },
        );

        this.topLabelComponent = null;
        this.plotComponent = null;
        this.bottomLabelComponent = null;
    }
}
