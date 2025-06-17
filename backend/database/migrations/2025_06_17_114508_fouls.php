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
        Schema::create('fouls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fk_id_jogador_faltas');
            $table->integer('cartao_amarelo')->default(0);
            $table->integer('cartao_vermelho')->default(0);
            $table->integer('quantidade_faltas')->default(0);
            $table->timestamps();

            $table->foreign('fk_id_jogador_faltas')->references('id')->on('players')->onDelete('cascade');
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
