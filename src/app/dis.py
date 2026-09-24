def main():
   
       
    
    n = int(input("Ingrese el tamaño de la matriz (n ≤ 10): "))
    
   
    if n > 10:
        print("Error: El tamaño debe ser menor o igual a 10")
        return
    
    
    matriz = [[0 for _ in range(n)] for _ in range(n)]
    
    print(f"\nMatriz {n}x{n} inicializada con ceros:")
    imprimir_matriz(matriz)
    
   
    print("\nIngrese los pares ordenados de la relación R:")
    print("Formato: a,b (ejemplo: 1,1)")
    print("Ingrese 'f' para terminar\n")
    
    while True:
        entrada = input("Ingrese par ordenado: ").strip()
        
      
        if not entrada:
            print("Error: Debe ingresar un par ordenado")
            continue
            
       
        if entrada.lower() == 'f':
            break
        
        
        if ',' not in entrada:
            print("Error: Formato incorrecto. Use: a,b (ejemplo: 1,1)")
            continue
            
        partes = entrada.split(',')
        
       
        if len(partes) != 2:
            print("Error: Debe ingresar exactamente dos números separados por coma")
            continue
        
        
        if not (partes[0].strip().isdigit() and partes[1].strip().isdigit()):
            print("Error: Debe ingresar números válidos")
            continue
            
        a = int(partes[0].strip())
        b = int(partes[1].strip())
        
       
        if 1 <= a <= n and 1 <= b <= n:
            
            matriz[b-1][a-1] = 1
            print(f"1 establecido en posición ({b},{a}) - renglón {b}, columna {a}")
            print("Matriz actual:")
            imprimir_matriz(matriz)
        else:
            print(f"Error: Los valores deben estar entre 1 y {n}")
    
    # Mostrar matriz final
    print("\nMatriz final de la relación R:")
    imprimir_matriz(matriz)
    
   
    es_reflexiva = verificar_reflexividad(matriz, n)
    es_simetrica = verificar_simetria(matriz, n)
    
    # 4) Mostrar resultados
    print("\nRESULTADOS:")
    print("===========")
    
    if es_reflexiva:
        print("✓ La relación ES REFLEXIVA")
    else:
        print("✗ La relación NO ES REFLEXIVA")
    
    if es_simetrica:
        print("✓ La relación ES SIMÉTRICA")
    else:
        print("✗ La relación NO ES SIMÉTRICA")

def imprimir_matriz(matriz):
    """Función para imprimir la matriz de forma legible"""
    n = len(matriz)
    print("   ", end="")
    for i in range(n):
        print(f"{i+1:2}", end=" ")
    print()
    
    for i in range(n):
        print(f"{i+1:2} ", end="")
        for j in range(n):
            print(f" {matriz[i][j]} ", end="")
        print()

def verificar_reflexividad(matriz, n):
    """Verifica si la relación es reflexiva"""
    # a) Si todos los elementos de la diagonal principal son 1's
    for i in range(n):
        if matriz[i][i] != 1:
            return False
    return True

def verificar_simetria(matriz, n):
    """Verifica si la relación es simétrica"""
    # b) Si la matriz es igual a su transpuesta
    for i in range(n):
        for j in range(n):
            if matriz[i][j] != matriz[j][i]:
                return False
    return True

# Ejecutar el programa
if __name__ == "__main__":
    main()