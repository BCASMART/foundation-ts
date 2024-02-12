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
    implementation:Function
}

export function $declareMethod<T>(cls:TSConstructor<T>, decl:TSClassMethodDeclaration):void 
{
    _assertDeclare(cls, decl, 'method') ;

    if (!_localOK(decl?.implementation)) {
        throw `Impossible to declare non-implemented method '${decl.element}()' to class '${cls.name}'` ;
    }
    if (!(typeof decl?.implementation === 'function')) {
        throw `Wrong implementation for method set '${decl?.element}'() to class '${cls.name}'` ;
    }

    Object.defineProperty(cls.prototype, decl!.element!, { value:decl!.implementation, enumerable:!!decl?.enumerable, configurable:!!decl?.configurable }) ;      
}

export interface TSClassAccessorDeclaration extends TSClassElementDeclaration {
    getter?:()=>any ;
    setter?:(v:any)=>void ;
}

export function $declareAccessor<T>(cls:TSConstructor<T>, decl:TSClassAccessorDeclaration):void
{
    _assertDeclare(cls, decl, 'accessor') ;
    if (!_localOK(decl?.getter) && !_localOK(decl?.setter)) {
        throw `Impossible to declare non-implemented accessor '${decl?.element}' to class '${cls.name}'` ;
    }
    if (_localOK(decl?.getter) && typeof decl?.getter !== 'function') {
        throw `Wrong implementation for accessor get '${decl?.element}'() to class '${cls.name}'` ;
    }
    if (_localOK(decl?.setter) && typeof decl?.setter !== 'function') {
        throw `Wrong implementation for accessor set '${decl?.element}'() to class '${cls.name}'` ;
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
    if (!_localOK(cls)) { throw `Impossible to declare ${type} ${decl?.element} on undefined class.` ; }
    if (!_localOK(decl?.element) || decl?.element?.length === 0) { throw `Impossible to declare unknown ${type} on class ${cls.name}.` ; }
}

function _localOK(v:any) { return v !== null && v !== undefined && typeof v !== 'undefined' ; }

// =============================================================================
// #WARNING: This file must remain independant from all other foundation-ts file
// =============================================================================
