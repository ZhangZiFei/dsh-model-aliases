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
.dma-alias-card{box-sizing:border-box;display:grid;width:100%;min-width:0;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:end;padding:16px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:12px}
.dma-field{display:flex;min-width:0;flex-direction:column;gap:6px}
.dma-field>span{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:16px}
.dma-field input{box-sizing:border-box;width:100%;min-width:0;height:36px;padding:0 12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;font:13px/20px inherit;outline:none}
.dma-field input:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}
.dma-field input:focus{border-color:var(--dsw-alias-brand-primary)}
.dma-field input::placeholder{color:var(--dsw-alias-label-dimmed)}
.dma-select{display:block;width:100%;min-width:0}
.dma-select__trigger{box-sizing:border-box;display:flex;width:100%;min-width:0;height:36px;align-items:center;justify-content:space-between;gap:12px;padding:0 14px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:18px;cursor:pointer;font:14px/22px inherit}
.dma-select__trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}
.dma-select__trigger[aria-expanded=true],.dma-select__trigger:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.dma-select__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dma-select__value{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dma-select__chevron{flex:none;color:var(--dsw-alias-label-caption)}
.dma-button--danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.dma-button--danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
.dma-alias-card__actions{display:flex;align-items:center;gap:8px;justify-self:start}
.dma-settings__actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}
.dma-settings__actions-group{display:flex;align-items:center;gap:10px}
.dma-settings__status{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
@media (max-width:620px){.dma-alias-card{grid-template-columns:minmax(0,1fr)}.dma-settings__actions{align-items:stretch;flex-direction:column}.dma-settings__actions-group{justify-content:space-between}}
`
