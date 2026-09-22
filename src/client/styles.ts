export const STYLE_TEXT = `
.dma-selector{min-width:0}
.dma-selector__trigger{display:flex;align-items:center;gap:5px;min-width:0;max-width:220px;height:28px;padding:0 8px;color:var(--dsw-alias-label-secondary);background:transparent;border:0;border-radius:16px;cursor:pointer;font:500 13px/20px inherit}
.dma-selector__trigger:hover:not(:disabled),.dma-selector__trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
.dma-selector__trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dma-selector__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dma-selector__label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dma-selector__chevron{flex:none;color:var(--dsw-alias-label-caption)}
.dma-selector__item{box-sizing:border-box;display:flex;width:240px;max-width:calc(100vw - 64px);min-width:0;flex-direction:column;gap:2px}
.dma-selector__item-name{display:block;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px}
.dma-selector__item-route{display:block;color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dma-selector__item-state{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.dma-selector__message{display:block;width:220px;max-width:calc(100vw - 84px);color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dma-selector__error{display:block;width:220px;max-width:calc(100vw - 84px);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.dma-settings{box-sizing:border-box;display:flex;width:100%;max-width:720px;min-width:0;flex-direction:column;gap:12px;padding:4px 0 32px;color:var(--dsw-alias-label-primary)}
.dma-settings__header h2{margin:0 0 6px;font-size:18px;font-weight:600;line-height:26px}
.dma-settings__header p{max-width:720px;margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dma-settings__notice{padding:10px 12px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;font-size:12px;line-height:18px}
.dma-settings__error{padding:10px 12px;color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger);border-radius:10px;font-size:12px;line-height:18px}
.dma-settings__list{display:flex;flex-direction:column;gap:12px}
.dma-settings__empty{padding:28px 18px;color:var(--dsw-alias-label-tertiary);text-align:center;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;font-size:13px;line-height:20px}
/* 表格布局 */
.dma-alias-table{display:flex;flex-direction:column;gap:4px}
.dma-alias-row{display:grid;grid-template-columns:28px minmax(50px,0.5fr) minmax(110px,1.1fr) minmax(110px,1.1fr) minmax(70px,0.7fr) 32px;gap:6px;align-items:center;padding:4px 8px;border-radius:8px}
.dma-alias-row--header{padding-bottom:2px}
.dma-alias-row--header .dma-alias-cell{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:16px}
.dma-alias-row--data{background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2)}
.dma-alias-row--data:hover{border-color:var(--dsw-alias-border-l3)}
.dma-alias-row--dragging{opacity:0.4;border-style:dashed}
.dma-alias-row--drop-before{box-shadow:inset 0 2px 0 0 var(--dsw-alias-brand-primary)}
.dma-alias-row--drop-after{box-shadow:inset 0 -2px 0 0 var(--dsw-alias-brand-primary)}
.dma-alias-cell{display:flex;min-width:0;align-items:center}
.dma-alias-cell input{box-sizing:border-box;width:100%;min-width:0;height:32px;padding:0 8px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;font:13px/20px inherit;outline:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dma-alias-cell input:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}
.dma-alias-cell input:focus{border-color:var(--dsw-alias-brand-primary)}
.dma-alias-cell input::placeholder{color:var(--dsw-alias-label-dimmed)}
/* 拖拽手柄 */
.dma-drag-handle{display:flex;width:24px;height:24px;align-items:center;justify-content:center;padding:0;background:transparent;border:0;border-radius:6px;cursor:grab}
.dma-drag-handle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dma-drag-handle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dma-drag-handle:disabled{cursor:default;opacity:0.4}
.dma-drag-handle__icon{display:block;width:12px;height:8px;background-image:radial-gradient(circle,var(--dsw-alias-label-caption) 1.2px,transparent 1.3px);background-size:6px 4px;background-position:0 0,6px 0}
/* 删除按钮 */
.dma-remove-button{display:flex;width:24px;height:24px;align-items:center;justify-content:center;padding:0;color:var(--dsw-alias-label-caption);background:transparent;border:0;border-radius:6px;cursor:pointer;font-size:16px;line-height:1}
.dma-remove-button:hover:not(:disabled){color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger)}
.dma-remove-button:focus-visible{outline:2px solid var(--dsw-alias-state-error-primary);outline-offset:1px}
.dma-remove-button:disabled{cursor:default;opacity:0.4}
/* 组合框 */
.dma-combobox{display:block;width:100%;min-width:0}
.dma-combobox__control{box-sizing:border-box;display:flex;width:100%;min-width:0;height:32px;align-items:center;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.dma-combobox__control:hover{border-color:var(--dsw-alias-border-l3)}
.dma-combobox__control:focus-within{border-color:var(--dsw-alias-brand-primary)}
.dma-combobox__control input{height:30px;padding-right:2px;padding-left:8px;background:transparent;border:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dma-combobox__control input:hover:not(:disabled),.dma-combobox__control input:focus{border-color:transparent}
.dma-combobox__trigger{box-sizing:border-box;display:flex;width:26px;height:30px;flex:none;align-items:center;justify-content:center;padding:0;color:var(--dsw-alias-label-caption);background:transparent;border:0;border-radius:0 7px 7px 0;cursor:pointer}
.dma-combobox__trigger:hover:not(:disabled),.dma-combobox__trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
.dma-combobox__trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dma-combobox__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dma-combobox__chevron{flex:none}
.dma-settings__actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}
.dma-settings__actions-group{display:flex;align-items:center;gap:10px}
.dma-settings__status{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
/* 小屏回退为卡片式 */
@media (max-width:620px){
.dma-alias-row{grid-template-columns:24px minmax(0,1fr) 28px;grid-template-areas:'handle name remove' 'handle provider remove' 'handle model remove' 'handle effort remove';row-gap:8px}
.dma-alias-cell--handle{grid-area:handle}
.dma-alias-cell--name{grid-area:name}
.dma-alias-cell--provider{grid-area:provider}
.dma-alias-cell--model{grid-area:model}
.dma-alias-cell--effort{grid-area:effort}
.dma-alias-cell--remove{grid-area:remove}
.dma-alias-row--header{display:none}
.dma-settings__actions{align-items:stretch;flex-direction:column}
.dma-settings__actions-group{justify-content:space-between}
}
`
