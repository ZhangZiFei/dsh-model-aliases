window.__ModuleLoader__.load({
	id: "dsh-model-aliases",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/domain.ts
		/** 首次使用或用户清空别名后自动恢复的默认别名。 */
		const DEFAULT_MODEL_ALIASES = [{
			name: "falsh",
			provider: "deepseek-official",
			model: "deepseek-v4-flash",
			reasoningEffort: "max"
		}, {
			name: "pro",
			provider: "deepseek-official",
			model: "deepseek-v4-pro",
			reasoningEffort: "max"
		}];
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/** 在 Client 设置边界将未知 wire 值收窄为领域设置。 */
		function decodeModelAliasSettings(value) {
			if (!isRecord(value) || !Array.isArray(value.aliases)) return void 0;
			const aliases = [];
			for (const entry of value.aliases) {
				if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.provider !== "string" || typeof entry.model !== "string" || entry.reasoningEffort !== void 0 && typeof entry.reasoningEffort !== "string") return;
				aliases.push({
					name: entry.name,
					provider: entry.provider,
					model: entry.model,
					...entry.reasoningEffort === void 0 ? {} : { reasoningEffort: entry.reasoningEffort }
				});
			}
			const settings = { aliases };
			try {
				validateModelAliasSettings(settings);
				return settings;
			} catch {
				return;
			}
		}
		function requireCanonicalText(value, field) {
			if (value.length === 0) throw new TypeError(`${field}不能为空`);
			if (value !== value.trim()) throw new TypeError(`${field}首尾不能包含空白字符`);
		}
		/** 校验设置服务已经完成 schema 校验后的跨字段约束。 */
		function validateModelAliasSettings(value) {
			const names = /* @__PURE__ */ new Set();
			const selections = /* @__PURE__ */ new Set();
			for (const [index, alias] of value.aliases.entries()) {
				const prefix = `第 ${index + 1} 个别名`;
				requireCanonicalText(alias.name, `${prefix}的名称`);
				requireCanonicalText(alias.provider, `${prefix}的提供商`);
				requireCanonicalText(alias.model, `${prefix}的模型`);
				if (alias.reasoningEffort !== void 0) requireCanonicalText(alias.reasoningEffort, `${prefix}的推理等级`);
				if (names.has(alias.name)) throw new TypeError(`别名名称“${alias.name}”重复`);
				names.add(alias.name);
				const key = selectionKey(alias);
				if (selections.has(key)) throw new TypeError(`别名“${alias.name}”绑定了重复的模型配置`);
				selections.add(key);
			}
		}
		/** 去除表单输入首尾空白，并保留“未指定推理等级”的语义。 */
		function normalizeModelAliases(aliases) {
			return aliases.map((alias) => {
				const reasoningEffort = alias.reasoningEffort?.trim();
				return {
					name: alias.name.trim(),
					provider: alias.provider.trim(),
					model: alias.model.trim(),
					...reasoningEffort === void 0 || reasoningEffort.length === 0 ? {} : { reasoningEffort }
				};
			});
		}
		/** 为完整模型选择生成无分隔符碰撞的稳定键。 */
		function selectionKey(selection) {
			return JSON.stringify([
				selection.provider,
				selection.model,
				selection.reasoningEffort ?? null
			]);
		}
		function sameSelection(left, right) {
			return selectionKey(left) === selectionKey(right);
		}
		function aliasForSelection(aliases, selection, groups) {
			if (selection === null) return void 0;
			const exact = aliases.find((alias) => sameSelection(alias, selection));
			if (exact !== void 0) return exact;
			if (groups === void 0 || selection.reasoningEffort === void 0) return void 0;
			if ((groups.find((candidate) => candidate.id === selection.provider)?.models.find((candidate) => candidate.id === selection.model))?.reasoning?.defaultEffort !== selection.reasoningEffort) return void 0;
			return aliases.find((alias) => alias.provider === selection.provider && alias.model === selection.model && alias.reasoningEffort === void 0);
		}
		/** 依据当前会话目录判断别名是否仍可选择。 */
		function aliasAvailability(alias, groups) {
			const group = groups.find((candidate) => candidate.id === alias.provider);
			if (group === void 0) return {
				available: false,
				reason: "provider"
			};
			const model = group.models.find((candidate) => candidate.id === alias.model);
			if (model === void 0) return {
				available: false,
				reason: "model"
			};
			if (alias.reasoningEffort === void 0) return { available: true };
			const reasoning = model.reasoning;
			return reasoning !== void 0 && (reasoning.defaultEffort === alias.reasoningEffort || reasoning.efforts.some((effort) => effort.id === alias.reasoningEffort)) ? { available: true } : {
				available: false,
				reason: "effort"
			};
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "settings.model-aliases";
		const zh = {
			"nav": "模型别名",
			"selector.aria": "选择模型别名",
			"selector.custom": "自定义",
			"selector.empty": "尚未配置模型别名",
			"selector.loading": "正在加载模型别名…",
			"selector.retry": "重试",
			"selector.stale.provider": "提供商当前不可用",
			"selector.stale.model": "模型当前不可用",
			"selector.stale.effort": "推理等级当前不可用",
			"settings.title": "模型别名",
			"settings.description": "用一个易记名称绑定提供商、模型和可选推理等级。会话中的别名选择仍通过 DSH 原生模型校验链路提交。",
			"settings.loading": "正在读取设置…",
			"settings.catalogLoading": "正在读取当前会话的模型目录…",
			"settings.catalogUnavailable": "当前无法读取模型目录；仍可手动填写路由 ID。",
			"settings.empty": "还没有别名。添加一个别名后，它会出现在输入框右侧。",
			"settings.add": "添加别名",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.saved": "设置已保存",
			"settings.readOnly": "当前设置提供方只读。",
			"settings.aliasName": "别名",
			"settings.provider": "提供商",
			"settings.model": "模型",
			"settings.effort": "推理等级",
			"settings.providerDefault": "提供商默认",
			"settings.remove": "删除",
			"settings.moveUp": "上移",
			"settings.moveDown": "下移",
			"settings.unavailable": "不可用",
			"settings.manualHint": "请填写 DSH 使用的精确路由 ID。"
		};
		const en = {
			"nav": "Model aliases",
			"selector.aria": "Select a model alias",
			"selector.custom": "Custom",
			"selector.empty": "No model aliases configured",
			"selector.loading": "Loading model aliases…",
			"selector.retry": "Retry",
			"selector.stale.provider": "Provider is currently unavailable",
			"selector.stale.model": "Model is currently unavailable",
			"selector.stale.effort": "Reasoning effort is currently unavailable",
			"settings.title": "Model aliases",
			"settings.description": "Bind a memorable name to a provider, model, and optional reasoning effort. Alias selections still use DSH’s native model validation path.",
			"settings.loading": "Loading settings…",
			"settings.catalogLoading": "Loading the current session model directory…",
			"settings.catalogUnavailable": "The model directory is unavailable; route IDs can still be entered manually.",
			"settings.empty": "No aliases yet. Add one to make it available beside the composer.",
			"settings.add": "Add alias",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.saved": "Settings saved",
			"settings.readOnly": "The current settings provider is read-only.",
			"settings.aliasName": "Alias",
			"settings.provider": "Provider",
			"settings.model": "Model",
			"settings.effort": "Reasoning effort",
			"settings.providerDefault": "Provider default",
			"settings.remove": "Remove",
			"settings.moveUp": "Move up",
			"settings.moveDown": "Move down",
			"settings.unavailable": "Unavailable",
			"settings.manualHint": "Enter the exact route IDs used by DSH."
		};
		//#endregion
		//#region src/client/AliasSelector.tsx
		function routeLabel(alias) {
			return `${alias.provider} / ${alias.model}${alias.reasoningEffort === void 0 ? "" : ` / ${alias.reasoningEffort}`}`;
		}
		function AliasSelector(props) {
			const { locked, available, aliases, directory, loadDirectory, select, t } = props;
			const aliasState = (0, react.useSyncExternalStore)((listener) => aliases.subscribe(listener), () => aliases.getSnapshot());
			const directoryState = (0, react.useSyncExternalStore)((listener) => directory.subscribe(listener), () => directory.getSnapshot());
			const [open, setOpen] = (0, react.useState)(false);
			const [selectError, setSelectError] = (0, react.useState)(null);
			const configuredAliases = aliasState.value?.aliases ?? [];
			const currentAlias = (0, react.useMemo)(() => aliasForSelection(configuredAliases, directoryState.current, directoryState.groups), [
				configuredAliases,
				directoryState.current,
				directoryState.groups
			]);
			const menuAliases = (0, react.useMemo)(() => [...configuredAliases].reverse(), [configuredAliases]);
			(0, react.useEffect)(() => {
				if (available) loadDirectory();
			}, [available, loadDirectory]);
			if (!available) return null;
			const choose = async (alias) => {
				setSelectError(null);
				if (await select({
					provider: alias.provider,
					model: alias.model,
					...alias.reasoningEffort === void 0 ? {} : { reasoningEffort: alias.reasoningEffort }
				})) setOpen(false);
				else setSelectError(directory.getSnapshot().error ?? "模型选择未被 Host 接受");
			};
			const openMenu = () => {
				setOpen((value) => !value);
				setSelectError(null);
				loadDirectory();
			};
			const loading = aliasState.status === "loading" || directoryState.status === "idle" || directoryState.status === "loading";
			const error = selectError ?? directoryState.error;
			const selectedIndex = currentAlias === void 0 ? -1 : menuAliases.findIndex((alias) => alias.name === currentAlias.name);
			const items = [
				...error === null ? [] : [{
					id: "status:error",
					label: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dma-selector__error",
						children: error
					}),
					disabled: true
				}],
				...loading ? [{
					id: "status:loading",
					label: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dma-selector__message",
						children: t("selector.loading")
					}),
					disabled: true
				}] : [],
				...!loading && configuredAliases.length === 0 ? [{
					id: "status:empty",
					label: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dma-selector__message",
						children: t("selector.empty")
					}),
					disabled: true
				}] : [],
				...menuAliases.map((alias, index) => {
					const availability = aliasAvailability(alias, directoryState.groups);
					const reason = availability.reason === void 0 ? void 0 : t(`selector.stale.${availability.reason}`);
					return {
						id: `alias:${index}`,
						label: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dma-selector__item",
							title: reason,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dma-selector__item-name",
									children: alias.name
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dma-selector__item-route",
									children: routeLabel(alias)
								}),
								reason === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dma-selector__item-state",
									children: reason
								})
							]
						}),
						disabled: !availability.available || directoryState.status === "selecting"
					};
				})
			];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				className: "dma-selector",
				open,
				align: "end",
				side: "top",
				items,
				selectedId: selectedIndex < 0 ? void 0 : `alias:${selectedIndex}`,
				onClose: () => setOpen(false),
				onSelect: (id) => {
					if (!id.startsWith("alias:")) return;
					const alias = menuAliases[Number(id.slice(6))];
					if (alias !== void 0) choose(alias);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dma-selector__trigger",
					"aria-label": t("selector.aria"),
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled: locked,
					title: currentAlias?.name ?? t("selector.custom"),
					onClick: openMenu,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dma-selector__label",
						children: currentAlias?.name ?? t("selector.custom")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "dma-selector__chevron" })]
				})
			});
		}
		//#endregion
		//#region src/client/AliasSettingsSection.tsx
		function SettingsSelect({ value, options, disabled = false, ariaLabel, onChange }) {
			const [open, setOpen] = (0, react.useState)(false);
			const selected = options.find((option) => option.value === value);
			(0, react.useEffect)(() => {
				if (disabled) setOpen(false);
			}, [disabled]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				className: "dma-select",
				open,
				portal: true,
				align: "start",
				items: options.map((option) => ({
					id: option.value,
					label: option.label
				})),
				selectedId: value,
				onClose: () => setOpen(false),
				onSelect: (next) => {
					setOpen(false);
					onChange(next);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dma-select__trigger",
					"aria-label": ariaLabel,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled: disabled || options.length === 0,
					onClick: () => setOpen((current) => !current),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dma-select__value",
						children: selected?.label ?? value
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "dma-select__chevron" })]
				})
			});
		}
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function modelFor(groups, provider, model) {
			return groups.find((group) => group.id === provider)?.models.find((entry) => entry.id === model);
		}
		function uniqueAliasName(aliases) {
			let index = aliases.length + 1;
			while (aliases.some((alias) => alias.name === `别名 ${index}`)) index += 1;
			return `别名 ${index}`;
		}
		function sameAliases(left, right) {
			return JSON.stringify(left) === JSON.stringify(right);
		}
		function AliasSettingsSection(props) {
			const { aliases, loadCatalog, useSessions, t } = props;
			const state = (0, react.useSyncExternalStore)((listener) => aliases.subscribe(listener), () => aliases.getSnapshot());
			const currentSessionId = useSessions((sessions) => sessions.current);
			const [draft, setDraft] = (0, react.useState)([]);
			const [saving, setSaving] = (0, react.useState)(false);
			const [saveError, setSaveError] = (0, react.useState)(null);
			const [savedRevision, setSavedRevision] = (0, react.useState)();
			const [catalog, setCatalog] = (0, react.useState)({
				status: "idle",
				groups: [],
				error: null
			});
			(0, react.useEffect)(() => {
				setDraft((state.value?.aliases ?? []).map((alias) => ({ ...alias })));
			}, [state.revision, state.value]);
			(0, react.useEffect)(() => {
				if (currentSessionId === void 0) {
					setCatalog({
						status: "error",
						groups: [],
						error: null
					});
					return;
				}
				let active = true;
				setCatalog((previous) => ({
					...previous,
					status: "loading",
					error: null
				}));
				loadCatalog(currentSessionId).then((models) => {
					if (active) setCatalog({
						status: "ready",
						groups: models.groups,
						error: null
					});
				}, (error) => {
					if (active) setCatalog({
						status: "error",
						groups: [],
						error: messageOf(error)
					});
				});
				return () => {
					active = false;
				};
			}, [
				currentSessionId,
				loadCatalog,
				t
			]);
			const normalized = (0, react.useMemo)(() => normalizeModelAliases(draft), [draft]);
			const validationError = (0, react.useMemo)(() => {
				try {
					validateModelAliasSettings({ aliases: normalized });
					return null;
				} catch (error) {
					return messageOf(error);
				}
			}, [normalized]);
			const dirty = !sameAliases(normalized, state.value?.aliases ?? []);
			const replaceAt = (index, next) => {
				setSaveError(null);
				setDraft((current) => current.map((alias, at) => at === index ? next : alias));
			};
			const addAlias = () => {
				const firstGroup = catalog.groups[0];
				const firstModel = firstGroup?.models[0];
				setSaveError(null);
				setDraft((current) => [...current, {
					name: uniqueAliasName(current),
					provider: firstGroup?.id ?? "",
					model: firstModel?.id ?? ""
				}]);
			};
			const moveAlias = (index, offset) => {
				const target = index + offset;
				if (target < 0 || target >= draft.length) return;
				setSaveError(null);
				setDraft((current) => {
					const next = [...current];
					const swapped = next[index];
					next[index] = next[target];
					next[target] = swapped;
					return next;
				});
			};
			const save = async () => {
				if (validationError !== null) return;
				setSaving(true);
				setSaveError(null);
				await aliases.set("aliases", normalized);
				const snapshot = aliases.getSnapshot();
				if (sameAliases(snapshot.value?.aliases ?? [], normalized)) setSavedRevision(snapshot.revision);
				else setSaveError("设置未被 Host 接受，请检查连接或重新加载后再试。");
				setSaving(false);
			};
			const loading = state.status === "loading";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dma-settings",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dma-settings__header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("settings.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("settings.description") })]
					}),
					loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dma-settings__notice",
						children: t("settings.loading")
					}),
					catalog.status === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dma-settings__notice",
						children: t("settings.catalogLoading")
					}),
					catalog.status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dma-settings__notice",
						children: [t("settings.catalogUnavailable"), catalog.error === null ? "" : ` ${catalog.error}`]
					}),
					!state.writable && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dma-settings__notice",
						children: t("settings.readOnly")
					}),
					(saveError ?? validationError) !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dma-settings__error",
						children: saveError ?? validationError
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dma-settings__list",
						children: [draft.length === 0 && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dma-settings__empty",
							children: t("settings.empty")
						}), draft.map((alias, index) => {
							const selectedGroup = catalog.groups.find((group) => group.id === alias.provider);
							const selectedModel = modelFor(catalog.groups, alias.provider, alias.model);
							const providerKnown = selectedGroup !== void 0;
							const modelKnown = selectedModel !== void 0;
							const effortKnown = alias.reasoningEffort === void 0 || selectedModel?.reasoning?.defaultEffort === alias.reasoningEffort || selectedModel?.reasoning?.efforts.some((effort) => effort.id === alias.reasoningEffort);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
								className: "dma-alias-card",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dma-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.aliasName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: alias.name,
											onChange: (event) => replaceAt(index, {
												...alias,
												name: event.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dma-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.provider") }), catalog.groups.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: alias.provider,
											"aria-label": t("settings.provider"),
											placeholder: t("settings.manualHint"),
											onChange: (event) => replaceAt(index, {
												...alias,
												provider: event.target.value
											})
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsSelect, {
											value: alias.provider,
											ariaLabel: t("settings.provider"),
											options: [...!providerKnown ? [{
												value: alias.provider,
												label: `${alias.provider} · ${t("settings.unavailable")}`
											}] : [], ...catalog.groups.map((group) => ({
												value: group.id,
												label: group.name
											}))],
											onChange: (provider) => {
												const group = catalog.groups.find((entry) => entry.id === provider);
												replaceAt(index, {
													name: alias.name,
													provider,
													model: group?.models[0]?.id ?? ""
												});
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dma-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.model") }), selectedGroup === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: alias.model,
											"aria-label": t("settings.model"),
											placeholder: t("settings.manualHint"),
											onChange: (event) => replaceAt(index, {
												...alias,
												model: event.target.value
											})
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsSelect, {
											value: alias.model,
											ariaLabel: t("settings.model"),
											options: [...!modelKnown ? [{
												value: alias.model,
												label: `${alias.model} · ${t("settings.unavailable")}`
											}] : [], ...selectedGroup.models.map((model) => ({
												value: model.id,
												label: model.name
											}))],
											onChange: (model) => replaceAt(index, {
												name: alias.name,
												provider: alias.provider,
												model
											})
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dma-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.effort") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsSelect, {
											value: alias.reasoningEffort ?? "",
											ariaLabel: t("settings.effort"),
											options: [
												{
													value: "",
													label: t("settings.providerDefault")
												},
												...!effortKnown && alias.reasoningEffort !== void 0 ? [{
													value: alias.reasoningEffort,
													label: `${alias.reasoningEffort} · ${t("settings.unavailable")}`
												}] : [],
												...selectedModel?.reasoning?.efforts.map((effort) => ({
													value: effort.id,
													label: effort.name
												})) ?? []
											],
											onChange: (value) => {
												const next = {
													name: alias.name,
													provider: alias.provider,
													model: alias.model
												};
												if (value.length > 0) next.reasoningEffort = value;
												replaceAt(index, next);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dma-alias-card__actions",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												"aria-label": t("settings.moveUp"),
												disabled: index === 0,
												onClick: () => moveAlias(index, -1),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, {})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												"aria-label": t("settings.moveDown"),
												disabled: index === draft.length - 1,
												onClick: () => moveAlias(index, 1),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												type: "button",
												variant: "outline",
												className: "dma-button--danger",
												onClick: () => {
													setSaveError(null);
													setDraft((current) => current.filter((_, at) => at !== index));
												},
												children: t("settings.remove")
											})
										]
									})
								]
							}, index);
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "dma-settings__actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							type: "button",
							variant: "outline",
							onClick: addAlias,
							children: t("settings.add")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dma-settings__actions-group",
							children: [savedRevision === state.revision && !dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dma-settings__status",
								children: t("settings.saved")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								type: "button",
								variant: "primary",
								disabled: !dirty || validationError !== null || !state.writable || saving,
								onClick: () => void save(),
								children: saving ? t("settings.saving") : t("settings.save")
							})]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/styles.ts
		const STYLE_TEXT = `
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
`;
		//#endregion
		//#region src/client/index.tsx
		/** Client 端所需服务；modelDirectories 保证复用 DSH 原生模型目录与选择链路。 */
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"connection",
			"remote",
			"sessions",
			"modelDirectories"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "model-aliases: locale dictionaries");
			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-model-aliases";
				tag.textContent = STYLE_TEXT;
				document.head.appendChild(tag);
				return () => tag.remove();
			}, "model-aliases: styles");
			const aliasSettings = ctx.settingsScope.bind({
				namespace: "model-aliases",
				decode: decodeModelAliasSettings
			});
			ctx.effect(() => {
				let evaluatedRevision;
				const restoreDefaultsIfEmpty = () => {
					const snapshot = aliasSettings.getSnapshot();
					if (snapshot.status !== "ready" || !snapshot.writable) return;
					if (snapshot.revision === evaluatedRevision) return;
					evaluatedRevision = snapshot.revision;
					if (!(snapshot.value === void 0 || snapshot.value.aliases.length === 0)) return;
					aliasSettings.set("aliases", [...DEFAULT_MODEL_ALIASES]).catch(() => void 0);
				};
				restoreDefaultsIfEmpty();
				return aliasSettings.subscribe(restoreDefaultsIfEmpty);
			}, "model-aliases: restore defaults after clearing");
			const loadCatalog = async (sessionId) => {
				if (ctx.sessions.subagentAddress(sessionId) !== void 0) throw new Error("被寻址的子代理会话不支持模型选择");
				return ctx.modelDirectories.directoryFor(sessionId).load();
			};
			ctx.slots.inject("conversation.input.model", () => ctx.slots.register({
				name: "conversation.input.model",
				priority: -1,
				locale: NS,
				inject: (sessionId) => {
					const directory = ctx.modelDirectories.directoryFor(sessionId);
					const available = ctx.sessions.subagentAddress(sessionId) === void 0;
					return {
						available,
						aliases: aliasSettings,
						directory: directory.store,
						loadDirectory: () => {
							if (available) directory.load().catch(() => void 0);
						},
						select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
					};
				}
			}, AliasSelector));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "model-aliases",
				order: 15,
				label: () => ctx.locale.bind(NS)("nav"),
				locale: NS,
				inject: () => ({
					aliases: aliasSettings,
					loadCatalog
				})
			}, AliasSettingsSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map