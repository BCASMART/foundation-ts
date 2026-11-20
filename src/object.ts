// =============================================================================
// #WARNING: This file must remain independant from all other foundation-ts file
// =============================================================================

export type TSConstructor<T = unknown> = new (...args: any[]) => T;

export interface TSClassElementDeclaration {
    element:string ;
    enumerable?:boolean ;
    configurable?:boolean ;
}

export interface TSClassMethodDeclaration extends TSClassElementDeclaration {
    implementation:Function ;
    writable?:boolean ;
}

export function $declareMethod<T>(cls:TSConstructor<T>, decl:TSClassMethodDeclaration):void 
{
    _assertDeclare(cls, decl, 'method') ;

    if (!_localOK(decl?.implementation)) {
        throw new Error(`Impossible to declare non-implemented method '${decl.element}()' to class '${cls.name}'`) ;
    }
    if (typeof decl?.implementation !== 'function') {
        throw new TypeError(`Wrong implementation for method set '${decl?.element}'() to class '${cls.name}'`) ;
    }

    Object.defineProperty(cls.prototype, decl!.element!, { value:decl!.implementation, enumerable:!!decl?.enumerable, configurable:!!decl?.configurable, writable:!!decl?.writable }) ;
}

/**
 * Declares several methods on an existing class (String, Number, Map...) with the
 * same property descriptor as native methods: not enumerable (so invisible to
 * for...in loops) but writable and configurable, like a plain prototype assignment.
 * Each implementation is type checked against the class interface declaration.
 */
export function $declareMethods<T>(cls:TSConstructor<T>, methods:{ [K in Exclude<keyof T, keyof Object>]?: T[K] }):void
{
    for (const element of Object.keys(methods)) {
        $declareMethod(cls, { element:element, implementation:(methods as any)[element], writable:true, configurable:true }) ;
    }
}

export interface TSClassAccessorDeclaration extends TSClassElementDeclaration {
    getter?:()=>any ;
    setter?:(v:any)=>void ;
}

export function $declareAccessor<T>(cls:TSConstructor<T>, decl:TSClassAccessorDeclaration):void
{
    _assertDeclare(cls, decl, 'accessor') ;
    if (!_localOK(decl?.getter) && !_localOK(decl?.setter)) {
        throw new Error(`Impossible to declare non-implemented accessor '${decl?.element}' to class '${cls.name}'`) ;
    }
    if (_localOK(decl?.getter) && typeof decl?.getter !== 'function') {
        throw new TypeError(`Wrong implementation for accessor get '${decl?.element}'() to class '${cls.name}'`) ;
    }
    if (_localOK(decl?.setter) && typeof decl?.setter !== 'function') {
        throw new TypeError(`Wrong implementation for accessor set '${decl?.element}'() to class '${cls.name}'`) ;
    }
    Object.defineProperty(
        cls.prototype, 
        decl!.element!, 
        { 
            get:decl?.getter === null ? undefined : decl?.getter, 
            set:decl?.setter === null ? undefined : decl?.setter, 
            enumerable:!!decl?.enumerable, configurable:!!decl?.configurable 
        }
    ) ;      
} 

// ===== private functions ===================================
function _assertDeclare<T>(cls:TSConstructor<T>, decl:TSClassElementDeclaration, type:string):void
{
    if (!_localOK(cls)) { throw new Error(`Impossible to declare ${type} ${decl?.element} on undefined class.`) ; }
    if (!_localOK(decl?.element) || decl?.element?.length === 0) { throw new Error(`Impossible to declare unknown ${type} on class ${cls.name}.`) ; }
}

function _localOK(v:any) { return v !== null && v !== undefined ; }

// =============================================================================
// #WARNING: This file must remain independant from all other foundation-ts file
// =============================================================================
