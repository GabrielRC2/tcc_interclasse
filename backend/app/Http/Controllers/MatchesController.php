<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\MatchesResource;
use App\Models\Matches;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MatchesController extends Controller
{
    public function index(){
        return MatchesResource::collection(Matches::all());
    }

    public function store(Request $request){
        try {
            $validated = $request->validate([
                'status'=> 'required|string',
            ]);

            $foul = Matches::create($validated);
            return (new MatchesResource($foul))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $foul = Matches::findOrFail($id);
        return new MatchesResource($foul);
    }

    public function destroy($id){
        $foul = Matches::findOrFail($id);
        $foul->delete();
        return response()->json(['message' => 'Foul deleted successfully'], 200);
    }

    public function update(Request $request, $id){
        try {
            $foul = Matches::findOrFail($id);

            // 1. Validação dos dados para atualização
            $validated = $request->validate([
                'status'=> 'required|string',
            ]);

            // 2. Atualiza o registro com os dados validados
            $foul->update($validated);

            // 3. Retorna o recurso atualizado com status 200 OK
            return (new MatchesResource($foul))->response()->setStatusCode(200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
