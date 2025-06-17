<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reports', function(Blueprint $table){
            $table -> id();
            $table->unsignedBigInteger('fk_id_jogo');
            $table -> string('nome_time');
            $table -> integer('pontos_totais');
            $table -> string('genero_time');

            $table->foreign('fk_id_jogo')->references('id')->on('matches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
